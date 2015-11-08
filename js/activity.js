var GLOBAL = GLOBAL || {
        inTool: false
    };

//var json = GLOBAL.json || 'data.json';

$.getJSON('data/data.json', function(json) { //TODO replace with VLE.getAttachment
	$(document).ready(function() {
		if (!GLOBAL.inTool) {
			console.log('Not in the tool!');

			setGlobal(json);
			initActivity();
		}

		$('.highlightable')
            .on('mousedown keydown', 'span.block, span.space', highlight)
            //.on('mousedown keydown', 'span.space', highlight)
		    .on('keydown', 'span.block', handleKeyEvents)
		    .on('mouseleave mouseup keyup', function() { $('.highlightable').off('mouseenter', 'span.block'); })
		    .on('selectstart', function(e) { e.preventDefault(); });
		$('#check').on('click', checkAnswer);
		$('#reveal').on('click', revealAnswer);
		$('.reset').on('click', reset);
		$('.buttons').on('click', 'div', selectPen);
	});

});

//TODO define handling of punctuation for word type
//TODO spaces/punctuation highlightable - just turn events on/off, leave colour info until output (remove if not selectable)?

function setGlobal(obj) {
	$.each(obj, function (key) {
		GLOBAL[key] = obj[key];
	});
}

function initActivity() {
    var buttonHTML = getButtonHTML();

    $('.buttons').html(buttonHTML);
    $('#question').html(decodeURI(GLOBAL.question));
    $('#answer').html(decodeURI(GLOBAL.answer));
}

function getButtonHTML() {
    var pens = !GLOBAL.inTool ? GLOBAL.pens : GLOBAL.allPens;
    var buttonHTML = '';
    var textAreaHTML = '<textarea class="pen_label" rows="2" maxlength="25" />';

    $.each(pens, function(key, val) {
        var label = !GLOBAL.inTool ? '<span>' + val.label + '</span>' : textAreaHTML;

        buttonHTML += '<div id="' + key + '_pen" class="pen" tabindex="1">' +
        '<img alt="' + key + ' highlighter pen" src="images/' + key + '1.jpg" />' +
        label +
        '</div>';
    });

    if (GLOBAL.eraser) {
        buttonHTML += '<div id="eraser" class="eraser" tabindex="1"><img src="images/eraser_load.jpg" alt="eraser" /></div>';
    }

    return buttonHTML;
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

function selectPen(e) {
    var id = e.currentTarget.id;

    if (id !== 'eraser') {
        var penColour = id.replace('_pen', '');
        GLOBAL.currentPen = penColour;
    } else {
        GLOBAL.currentPen = 'eraser';
    }

    console.log(GLOBAL.currentPen);
}

function highlight() {
    var $this = $(this);
    var $thisBlock;
    var $blockSpans;
    var $toHighlight;

    //console.log(GLOBAL.currentPen);

    if (GLOBAL.currentPen === null) {
        return false;
    }

    if ($this.hasClass('space')) { //move to it's own handler
        if (GLOBAL.spaceSelection !== 'manual') {
            return false;
        }
        $toHighlight = $this;
    } else {
        //$thisBlock = $this.closest('.block').addClass('highlighted');
        $thisBlock = $this.addClass('highlighted');
        $blockSpans = $thisBlock.find('span');
        $toHighlight = $blockSpans.addBack();
    }

    if (GLOBAL.spaceSelection === 'auto') {
        autoSelectSpaces($thisBlock);
    }

    if (GLOBAL.currentPen !== 'eraser') {
        removeHighlight($toHighlight);

		$toHighlight.addClass(GLOBAL.currentPen);

        //console.log(GLOBAL.preHighlight);

        if (GLOBAL.preHighlight) {
            $blockSpans
                .addClass('prehighlight')
                .removeAttr('tabindex');
        }

        if (GLOBAL.dragging) {
            $('.highlightable').on('mouseenter', 'span.block, span.space', dragHighlight);
            //TODO set drag event for spaces on if manual?
        }
    } else {
        removeHighlight($toHighlight);
    }
}

function dragHighlight(e) {
    var $toHighlight = $(this);

    console.log(e.target);

    //var $toHighlight = $(this).closest('.block');
    //var $toHighlight = GLOBAL.highlightType === 'char' ? $(this) : $(this).children();

    //console.log($(this));
    //console.log('dragging');
    //TODO fix drag highlighting

    if (GLOBAL.spaceSelection === 'auto') {
        autoSelectSpaces($toHighlight);
    }

    //TODO set up manual drag space selection

    //$toHighlight.not('.prehighlight').addClass(GLOBAL.currentPen);

    if (GLOBAL.preHighlight) {
        $toHighlight.addClass('prehighlight');
    }

    $('.highlightable').off('mouseenter', 'span.block, span.space');

    if ($toHighlight.hasClass('space')) {
        if (GLOBAL.spaceSelection === 'manual') {
            $toHighlight.trigger('mousedown');
        }
    }
    else {
        $toHighlight.children().first().trigger('mousedown');
    }
}

function highlightOld() {
    var $toHighlight = GLOBAL.highlightType === 'char' ? $(this) : $(this).children(); //make toHighlight 'this'??
    //var $toHighlight;

    if (GLOBAL.currentPen === null) {
        return false;
    }

    if ($(this).hasClass('space')) { //&& !== manual
        if (GLOBAL.spaceSelection === 'manual') { //!== return false
            $toHighlight = $(this);
        } else {
            return false;
        }
    }
    else if (GLOBAL.highlightType === 'char') { //!== char use else code
        $toHighlight = $(this);
    }
    else {
        //var $thisBlock = $(this).closest('.block').addClass('highlighted');
        var $thisBlock = $(this).addClass('highlighted');

        if (GLOBAL.spaceSelection === 'auto') {
            autoSelectSpaces($thisBlock);
        }

        $toHighlight = $thisBlock.find('span').addBack();
    }

    if (GLOBAL.currentPen !== 'eraser') {
        removeHighlight($toHighlight);

        $toHighlight.not('.prehighlight').addClass(GLOBAL.currentPen);

        console.log(GLOBAL.preHighlight);

        if (GLOBAL.preHighlight) {
            $toHighlight
                .addClass('prehighlight')//TODO needs to go on spans, not .block!!!
                .removeAttr('tabindex')
        }

        if (GLOBAL.dragging) {
            $('.highlightable').on('mouseenter', 'span.block', function dragHighlight() {
                //var $toHighlight = $(this);
                var $toHighlight = GLOBAL.highlightType === 'char' ? $(this) : $(this).children();

                //console.log($(this));
                //console.log('dragging');
                //TODO spaces not auto highlighted when dragging

                if (GLOBAL.spaceSelection === 'auto') {
                    autoSelectSpaces($toHighlight);
                }

                $toHighlight.not('.prehighlight').addClass(GLOBAL.currentPen);

                if (GLOBAL.preHighlight) {
                    $toHighlight.addClass('prehighlight');
                }

                //$toHighlight.first().trigger('mousedown');
            });
        }
    } else {
        removeHighlight($toHighlight);
    }
}

function autoSelectSpaces($selection) {
    var $s = $selection || $('.block');

    $s.each(function() {
        var $thisBlock = $(this);
        var $prev = $thisBlock.prevAll(':not(.space)').first();
        var $next = $thisBlock.nextAll(':not(.space)').first();
        var $prevBlock = $thisBlock.prevAll('.block:first');
        var $nextBlock = $thisBlock.nextAll('.block:first');
        var $prevSpace = $thisBlock.prev('.space');
        var $nextSpace = $thisBlock.next('.space');
        var $firstInlineParent = getFirstInlineParent(this);

        //console.log($prevBlock, $nextBlock);

        if ($firstInlineParent[0] === this) {
            //console.log('block');
            if (!$prev.hasClass('block')) {
                //console.log('last');
                $prevBlock = $prev.find('.block').last();
            }

            if (!$next.hasClass('block')) {
                $nextBlock = $next.find('.block').first();
            }
        } else {
            //console.log('inline');
            if ($prev.length === 0 && $firstInlineParent.prev().length > 0) {
                $prevBlock = $firstInlineParent.prevAll('.block:first');
                $prevSpace = $prevBlock.next('.space');
            }

            if ($next.length === 0 && $firstInlineParent.next().length > 0) {
                $nextBlock = $firstInlineParent.nextAll('.block:first');
                $nextSpace = $nextBlock.prev('.space');
            }
        }

        console.log($prevBlock.is('.highlighted.' + GLOBAL.currentPen));

        if ($prevBlock.is('.highlighted.' + GLOBAL.currentPen)) {
            console.log('prev highlighted');
            $prevSpace.addClass(GLOBAL.currentPen);
        }
        else {
            removeHighlight($prevSpace);
        }

        if ($nextBlock.is('.highlighted.' + GLOBAL.currentPen)) {
            $nextSpace.addClass(GLOBAL.currentPen);
        }
        else {
            removeHighlight($nextSpace);
        }
    });
}

function getFirstInlineParent($el) {
    var $firstInlineParent;

    if (!($el instanceof jQuery)) {
        $el = $($el);
    }

    $firstInlineParent = $el;

    if ($el.css('display') !== 'inline') {
        return false;
    }

    $el.parents().each(function() {
        if ($(this).css('display') !== 'inline') {
            return false;
        }

        $firstInlineParent = $(this);
    });

    return $firstInlineParent;
}

function removeHighlight($s) {
	var pens = GLOBAL.inTool ? getPensInUse() : GLOBAL.pens;

	$.each(pens, function(key) {
		$s.removeClass(key);
	});

    if (GLOBAL.currentPen === 'eraser') {
        $s.removeClass('highlighted')
    }

    return $s;
}

function checkAnswer() {
    var $attempt = $('#question').find('span');
    var $answer = $('#answer').find('span');
    var $feedback = $('#feedback');

    $feedback.empty();

    $attempt.each(function(i) {
        //classList not supported in IE8/9
        //var attempt = this.classList;
        //var answer = $answer[i].classList;
        var attemptClasses = this.className;
        var answerClasses = $answer[i].className;
        var attemptArray = attemptClasses.split(' ').sort();
        var answerArray = answerClasses.split(' ').sort();

        if (attemptArray.length !== answerArray.length) {
            $feedback.append('<p>Wrong!</p>');
            return false;
        }

        for (var i = 0; i < attemptArray.length; i++) {
            //Don't check spaces if set to manually select or no select.

            if (attemptArray[i] !== answerArray[i]) {
                $feedback.html('<p>Wrong!</p>');
                return false;
            }
        }

        //Must be correct...
        //$('#feedback').html('Correct!');
    });

    $feedback.append(getHighlightedText());

    //Partially correct response!?

    //Show correct answer as well as text version

    //The following text is highlighted in yellow...
    //The following text is highlighted in green...


}

function getHighlightedText() {
    var pens = !GLOBAL.inTool ? GLOBAL.pens : getPensInUse();
    var highlighted = '';

    //console.log(pens);

    $.each(pens, function(key) {
        var $wrapper = $('<div id="' + key + '_text"><p>The following text is highlighted ' + key + ':</p></div>');

        $('#answer').find('.' + key + ':not(.block)').clone().removeAttr('class').wrapAll('<div></div>').appendTo($wrapper);

        highlighted += $wrapper.html();
    });

    console.log(highlighted);

    return highlighted;
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

function reset(e) {
    //TODO sort the behaviour for the preview...
    var $selection = $('#question');

    if (GLOBAL.inTool && !$(e.target).hasClass('preview')) {
        $selection = $('#highlight');
    }

    removeHighlight($selection.find('span'));

    $('.block').removeClass('highlighted');

    if (GLOBAL.inTool) {
        GLOBAL.pens = {};
        getPensInUse();
    }

    $('#result').empty();
}