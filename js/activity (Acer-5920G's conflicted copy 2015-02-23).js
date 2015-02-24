var GLOBAL = GLOBAL || {};


$.getJSON('data.json', function(json) { //TODO replace with VLE.getAttachment
	$(document).ready(function() {
		if (!GLOBAL.inTool) {
			console.log('Not in the tool!');

			setGlobal(json);
			initActivity();

			var buttonHTML = getButtonHTML();
			$('.buttons').html(buttonHTML);
		}

		$('.highlightable')
            .on('mousedown keydown', 'span:not(.block)', highlight)
		    .on('keydown', 'span.block', handleKeyEvents)
		    .on('mouseleave mouseup keyup', function() { $('.highlightable').off('mouseover', 'span'); })
		    .on('selectstart', function(e) { e.preventDefault(); });
		$('#check').on('click', checkAnswer);
		$('#reveal').on('click', revealAnswer);
		$('.reset').on('click', reset);
		$('.buttons').on('click', 'div', selectPen);
	});

});

//TODO define handling of punctuation for word type
//TODO spaces/punctuation hilightable - just turn events on/off, leave colour info until output (remove if not selectable)?

function initActivity() {
	$('#question').html(decodeURI(GLOBAL.question));
	$('#answer').html(decodeURI(GLOBAL.answer));
}

function handleKeyEvents(e) {
    if (e.which === 13) {
        var event = jQuery.Event('mousedown');
        event.target = $(this).find('span')[0];

        $(e.delegateTarget).trigger(event);

        $(this).next().focus();

        console.log($(this).next());
    }
}

function setGlobal(obj) {
	$.each(obj, function (key) {
		GLOBAL[key] = obj[key];
	});
}

function getButtonHTML(preview) {
	var pens = !GLOBAL.inTool || preview ? GLOBAL.pens : GLOBAL.allPens;
	var buttonHTML = '';
    var textAreaHTML = '<textarea class="pen_label" rows="2" maxlength="25" />';

	$.each(pens, function(key, val) {
		var label = !GLOBAL.inTool || preview ? '<span>' + val.label + '</span>' : textAreaHTML;

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

function autoSelectSpaces($selection) {
    //on type change - all blocks
    //on highlight new - this el
    //on highlight change - this el (remove if different)

    var $s = $selection || $('.block');

    $s.each(function() {
        var $thisBlock = $(this);
        var $prevBlock = $thisBlock.prevAll('.block:first');
        var $nextBlock = $thisBlock.nextAll('.block:first');

        if ($prevBlock.length > 0 && $prevBlock.hasClass('highlighted')) {
            if ($prevBlock.hasClass(GLOBAL.currentColour)) {
                $thisBlock.prev().addClass(GLOBAL.currentColour);
            }
            else {
                removeHighlight($thisBlock.prev());
            }
        }

        if ($nextBlock.length > 0 && $nextBlock.hasClass('highlighted')) {
            if ($nextBlock.hasClass(GLOBAL.currentColour)) {
                $thisBlock.next().addClass(GLOBAL.currentColour);
            }
            else {
                removeHighlight($thisBlock.next());
            }
        }
    });
}

function highlight() {
    var $toHighlight;

    if ($(this).hasClass('space')) {
        if (GLOBAL.spaceSelection === 'manual') {
            $toHighlight = $(this);
        } else {
            return false;
        }
    }
    else if (GLOBAL.highlightType === 'char') {
        $toHighlight = $(this);
    }
    else {
        var $thisBlock = $(this).closest('.block').addClass('highlighted');

		if (GLOBAL.spaceSelection === 'auto') {
            autoSelectSpaces($thisBlock);
		}

        $toHighlight = $thisBlock.find('span').addBack();
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
	var pens = GLOBAL.inTool ? getPensInUse() : GLOBAL.pens;

	$.each(pens, function(key, val) {
		$s.removeClass(key);
	});

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
	var $attempt = $('#question span:not(.block)');
	var $answer = $('#answer span:not(.block)');

	$('#feedback').empty();
	
	$attempt.each(function(i) {
		//classList not supported in IE8/9
		//var attempt = this.classList;
		//var answer = $answer[i].classList;
		var attemptClasses = this.className;
		var answerClasses = $answer[i].className;
		var attemptArray = attemptClasses.split(' ').sort();
		var answerArray = answerClasses.split(' ').sort();

        console.log(GLOBAL.pens);

        var answer = '';

        $.each(GLOBAL.pens, function(key, val) {
            var $html = $('<div><p>The following is highlighted in ' + key + ':</p></div>');

            $html.append($('#answer .' + key).html());

            answer += $html.html();
        });

        console.log(answer);

        if (attemptArray.length !== answerArray.length) {
			$('#feedback').append('<div>Wrong!</div>' + answer);
			return false;
		}
		
		for (var i = 0; i < attemptArray.length; i++) {
			//Don't check spaces if set to manually select or no select.

			if (attemptArray[i] !== answerArray[i]) {
                $('#feedback').append('<div>Wrong!</div>' + answer);
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
    //TODO sort the behaviour for the preview...
    var selection = GLOBAL.inTool ? GLOBAL.$spans : $('#activity #highlight span');

    removeHighlight(selection);

    if (GLOBAL.inTool) {
        GLOBAL.pens = {};
        getPensInUse();
    }

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
