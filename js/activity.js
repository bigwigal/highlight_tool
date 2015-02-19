var GLOBAL = GLOBAL || {};

$.getJSON('data.json', function(json) { //TODO replace with VLE.getAttachment
	$(document).ready(function() {
		if (!GLOBAL.inTool) {
			console.log('Not in the tool!');

			setGlobalFromJSON(json);
			initActivity();

			var buttonHTML = getButtonHTML();
			$('.buttons').html(buttonHTML);
		}

		$('.highlightable').on('mousedown', 'span:not(.block)', highlight); //TODO add key actions
		$('.highlightable').on('mouseleave mouseup', function() { $('.highlightable').off('mouseover', 'span'); });
		$('.highlightable').on('selectstart', function(e) { e.preventDefault(); });
		$('#check').on('click', checkAnswer);
		$('#reveal').on('click', revealAnswer);
		$('.reset').on('click', reset);
		$('.buttons').on('click', 'div', selectPen);
	});

});

//TODO define handling of punctuation for word type
//TODO spaces/punctuation hilightable - just turn events on/off, leave colour info until output (remove if not selectable)?
//TODO allow dragging

function initActivity() {
	$('#question').html(decodeURI(GLOBAL.question));
	$('#answer').html(decodeURI(GLOBAL.answer));
}

function setGlobalFromJSON(json) {
	$.each(json, function (key) {
		GLOBAL[key] = json[key];
	});
}

function getButtonHTML() {
	var pens = GLOBAL.inTool ? GLOBAL.allPens : GLOBAL.pens;
	var buttonHTML = '';

	$.each(pens, function(key, val) {
		var label = GLOBAL.inTool ? '<textarea class="pen_label" rows="2" maxlength="25" />' : '<div>' + val.label + '</div>';

		buttonHTML += '<div id="' + key + '_pen" class="colourbutton" tabindex="1">' +
			'<img alt="' + key + ' highlighter pen" src="images/' + key + '1.jpg" />' +
			label +
		'</div>';
	});

    if (GLOBAL.eraser) {
        buttonHTML += '<div id="eraser" class="eraserdiv" tabindex="1"><img src="images/eraser_load.jpg" alt="eraser" /></div>';
    }

	return buttonHTML;
}

function highlight() {
    var $toHighlight;

    if (GLOBAL.highlightType === 'char') {
        $toHighlight = $(this);
    }
    else {
        $toHighlight = $(this).parents('.block').addClass('highlighted').find('span');

		if (GLOBAL.spaceSelection === 'auto') {
			var $thisBlock = $(this).parents('.block');
			var $prevBlock = $thisBlock.prevAll('.block:first');
			var $nextBlock = $thisBlock.nextAll('.block:first');

			if ($prevBlock.length > 0 && $prevBlock.hasClass('highlighted')) {
				$toHighlight = $toHighlight.add($thisBlock.prev());
			}

			if ($nextBlock.length > 0 && $nextBlock.hasClass('highlighted')) {
				$toHighlight = $toHighlight.add($thisBlock.next());
			}
		}
    }
    if (GLOBAL.currentColour !== 'eraser') {
        removeHighlight($toHighlight);

		$toHighlight
            .addClass(GLOBAL.currentColour);

        if (GLOBAL.dragging) {
            $('.highlightable').on('mouseover', 'span', function () {
                var $toHighlight = GLOBAL.highlightType === 'char' ? $(this) : $(this).children();

                console.log('dragging');
                //TODO spaces not auto highlighted when dragging

                $toHighlight.addClass(GLOBAL.currentColour);
            });
        }
    } else {
        removeHighlight($toHighlight);
    }
}

function removeHighlight($s) {
	var pens = GLOBAL.tool ? getPensInUse() : GLOBAL.pens;

	$.each(pens, function(key, val) {
		$s.removeClass(key);
	});

	$('.block').removeClass('highlighted');

	return $s;
}

function revealAnswer(e) {
	var $answer = $('#answer');

	if ($answer.is(':visible')) {
		$('#question').show();
		$answer.hide();
		e.target.value = 'Reveal answer';
	}
	else {
		$('#question').hide();
		$answer.show();
		e.target.value = 'Hide answer';
	}
}

function checkAnswer() {
	var $attempt = $('#question span');
	var $answer = $('#answer span');

	$('#feedback').empty();
	
	$attempt.each(function(i) {
		//classList not supported in IE8/9
		//var attempt = this.classList;
		//var answer = $answer[i].classList;
		var attemptClasses = this.className;
		var answerClasses = $answer[i].className;
		var attemptArray = attemptClasses.split(' ').sort();
		var answerArray = answerClasses.split(' ').sort();

		if (attemptArray.length !== answerArray.length) {
			$('#feedback').html('Wrong!');
			return false;
		}
		
		for (var i = 0; i < attemptArray.length; i++) {
			//Don't check spaces if set to manually select or no select.

			if (attemptArray[i] !== answerArray[i]) { 
				$('#feedback').html('Wrong!');
				return false;   
			}           
		}
		
		//Must be correct...
		$('#feedback').html('Correct!');

		//Partially correct response!?
		
		//Show correct answer as well as text version
		
		//The following text is highlighted in yellow...
		//The following text is highlighted in green...
	})
}
	
function reset() {
	/*$.each(colours, function(i, val) {
		$spans.removeClass(val);
	});*/
	removeHighlight(GLOBAL.$spans);

	$('#result').empty();
}

function selectPen(e) {
	var id = e.currentTarget.id;

	if (id !== 'eraser') {
		var penColour = id.replace('_pen', '');
		GLOBAL.currentColour = penColour;
	} else {
		GLOBAL.currentColour = 'eraser';
	}

	console.log(GLOBAL.currentColour);
}

function getSelection($span, start, end) {
    var $prev = $span.prevUntil('.' + start);
    var $next = $span.nextUntil('.' + end);

    return $span.add($prev).add($next);
}
