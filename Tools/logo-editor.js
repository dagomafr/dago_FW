if (!String.prototype.trim) {
	String.prototype.trim = function () {
		return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
	};
}

jQuery(function($) {

	var toByteStr = function(v) {
		var s = v.toString(16);
		if (v < 16) {
			s = "0"+s;
		}
		return "0x" + s.toUpperCase();
	}

	var updateCCode = function( pixOnDatas ) {
		var lines = [];

		var pix, pixN = pixOnDatas.length;
		for(var i=0; i<38; i++) {
			var line = [];
			for(var j=0; j<112; j++) {
				var inLineIdx = Math.floor(j / 8);
				var bitIdx = j % 8;
				line[inLineIdx] = line[inLineIdx] || 0x00;
				if ( pixOnDatas[i*112+j] ) {
					line[inLineIdx] = line[inLineIdx] | ( 0x80 >> bitIdx );
				}
			}
			var e,n=line.length;
			for(e=0; e<n; e++) {
				line[e] = toByteStr( line[e] );
			}
			lines.push(line.join(', '));
		}
		$('#c-code').val( lines.join( ", \n" ) );
	};

	var generateGrid = function(e) {
		var cCode = $(this).val();
		var cCodeLines = cCode.split('\n');

		var i,n=cCodeLines.length;

		var jTable = $("<table id='logo'/>");
		var maxPartWidth;

		for(i=0; i<n; i++) {
			var line = cCodeLines[i].trim();
			if ( !line.startsWith( '0x' ) ) continue;
			var jRow = $("<tr/>");

			var pixParts = line.split(',');

			var j,m = pixParts.length;
			for(j=0; j<m; j++) {
				var pixPart = pixParts[j].trim();
				if ( !pixPart.startsWith( '0x' ) ) continue;
				maxPartWidth = (maxPartWidth || 0)+1;
				var pixPartValue = parseInt( pixPart );
				var b;
				var current = 0x80;
				for( b=0; b<8; b++ ) {
					var jTd = $("<td/>");
					/*
					jTd.click( function(e) {
						$(this).toggleClass( 'enable' );
						updateCCode();
					} );
					*/
					jTd.on('mousedown mouseover', function(e) {
						if (e.buttons != 1) return;
						if ( 'drawState' in window ) {
							if ( window.drawState ) {
								$(this).addClass( 'enable' );
							}
							else {
								$(this).removeClass( 'enable' );
							}
						} else {
							$(this).toggleClass( 'enable' );
							window.drawState = $(this).hasClass( 'enable' );
						}
					} );
					
					jTd.on('mouseup', function(e) {
						console.log("up");
						delete window.drawState;
						updateCCode();
					});

					if ( current & pixPartValue ) {
						jTd.addClass( 'enable' );
					}
					
					jRow.append(jTd);
					current = current >> 1;
				}
			}

			jTable.append( jRow );
		}
		$('#right').empty();
		$('#right').append( jTable );
	};

	var generateThresoldedAndBWImage = function() {
		var img = document.getElementById('original-image');
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		context.imageSmoothingEnabled = false;
		canvas.width = 112;
		canvas.height = 38;
		context.drawImage(img, 0, 0, 112, 38 );
		var myData = context.getImageData(0, 0, 112, 38);

		var threshold = parseInt($('#threshold-value').val());

		var imgBuffer = myData.data;
		var pixIdx = 0, nPix = imgBuffer.length / 4;
		var onData = [];
		for( pixIdx=0; pixIdx < nPix; pixIdx++ ) {
			var r = imgBuffer[pixIdx*4+0];
			var g = imgBuffer[pixIdx*4+1];
			var b = imgBuffer[pixIdx*4+2];
			var a = imgBuffer[pixIdx*4+3];

			var on = (( r + g + b ) / 3.0) < threshold;

			imgBuffer[pixIdx*4+0] = on ? 0 : 255;
			imgBuffer[pixIdx*4+1] = on ? 0 : 255;
			imgBuffer[pixIdx*4+2] = on ? 0 : 255;
			imgBuffer[pixIdx*4+3] = 255;

			onData.push(on);
		}

		context.putImageData( myData, 0, 0 );

		$('#tabw-image').attr( 'src', canvas.toDataURL("image/png") );

		updateCCode( onData );
	};

	$('#c-code').change(generateThresoldedAndBWImage);
	$('#c-code').keyup(generateThresoldedAndBWImage);
	$('#threshold-value').keyup(generateThresoldedAndBWImage);
	$('#threshold-value').change(generateThresoldedAndBWImage);

	generateThresoldedAndBWImage();

});