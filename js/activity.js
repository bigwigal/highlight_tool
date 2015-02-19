var GLOBAL = {
    currentColour: 'yellow',
    dragging: true,
    allPens: {
        yellow: {},
        green: {},
        pink: {},
        blue: {},
        orange: {},
        red: {}
    },
    pens: {},
    eraser: true,
    markSpaces: false,
    markPunctuation: false,

    //used in tool only...
    initialGenerate: true,
    $spans: null,
    $tiny: null
};


var stops = {
	character: [''],
	sentence: ['stop'],
	word: ['comma', 'stop', 'space']
};


$.getJSON('data.json', function(json) { //TODO replace with VLE.getAttachment
	$(document).ready(function() {
		if ($('title').text() !== 'Highlighting tool') { //TODO find better way to do this!
			console.log('Not in the tool!');

			setGlobalFromJSON(json);
			initActivity();

			var buttonHTML = getButtonHTML();
			$('.buttons').html(buttonHTML);
		}

		$('.highlightable').on('mousedown', 'span:not(.block)', highlight);
		$('.highlightable').on('mouseleave mouseup', function() { $('.highlightable').off('mouseover', 'span:not(.block)'); });
		$('.highlightable').on('selectstart', function(e) { e.preventDefault(); });
		$('#check').on('click', checkAnswer);
		$('#reveal').on('click', revealAnswer);
		$('.reset').on('click', reset);
		$('.buttons').on('click', 'div', selectPen);
	});

});

//TODO define handling of punctuation for word type

/* Function to generate JSON. HTML page to have following options...
 * show all 6 pens but only add to JSON if used
 * show eraser and option to include in answer
 * question text - no colour info
 * answer - with colour info
 * activity type (controls how things are highlighted - exactly the same during set up and answer)
 types:
 character - this
 word - until space, stop, comma etc.
 sentence - until stop
 paragraph - all
 custom - until custom class
 * spaces selectable?
 * allow dragging
 */

function initActivity() {
	$('#question').html(decodeURI(GLOBAL.question));
	$('#answer').html(decodeURI(GLOBAL.answer));
}

function setGlobalFromJSON(json) {
	$.each(json, function (key) {
		GLOBAL[key] = json[key];
	});
}

function getButtonHTML(tool) {
	var pens = tool ? GLOBAL.allPens : GLOBAL.pens;
	var buttonHTML = '';

	$.each(pens, function(key, val) {
		var label = tool ? '<textarea class="pen_label" rows="2" maxlength="25" />' : '<div>' + val.label + '</div>';

		buttonHTML += '<div id="' + key + '_pen" class="colourbutton" tabindex="1">' +
			'<img alt="' + key + ' highlighter pen" src="images/' + key + '1.jpg" />' +
			label +
		'</div>';
	});

	buttonHTML += '<div id="eraser" class="eraserdiv" tabindex="1"><img src="images/eraser_load.jpg" alt="eraser" /></div>';

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

		console.log($toHighlight);

		$toHighlight
            .addClass(GLOBAL.currentColour);

        if (GLOBAL.dragging) {
            $('.highlightable').on('mouseover', 'span:not(.block)', function () {
                $(this).addClass(GLOBAL.currentColour);
            });
        }
    } else {
        removeHighlight($toHighlight);
    }
}

function highlightOld() {
	var $curr = $(this);
	var $toHighlight;
	var $prev;
	var $next;
	var $selection;
	var $prevSpace;
    var prevWordSelected = true;

	// define 'block' to be highlighted
	// getHighlightSelection($curr) - return current block
	// getPreviousHighlightBlock(first element before $prevSpace) - use getHighlightTarget and return previous block
	// if previousBlockHighlighted && spaceSelection === 'auto' then highlight space

	console.log(GLOBAL.highlightType);

    switch(GLOBAL.highlightType) {
        case 'char':
            $selection = $curr;
			$prevSpace = $selection.prev('.space');
			$toHighlight = $selection;
            break;
        case 'word':
            //write as function... if (activityType !== character) { call the function with type }
            //generalise - previous block/element/chunk (defined by type) selected.
            $prev = $curr.prevUntil('.space');
            $next = $curr.nextUntil('.space');
            $selection = $curr.add($prev).add($next);
            $prevSpace = $selection.prev('.space');

            $.each(stops[GLOBAL.highlightType], function(i, value) {
                if ($selection.last().hasClass(value)) {
                    $selection = $selection.filter(':not(.' + value + ')');
                }
            });

            if (prevWordSelected) {
                //$prevSpace = $prev.eq($prev.length - 1).prev('.space');
                $selection = $selection.add($prevSpace);
            }

            $toHighlight = $selection;
            break;
        case 'sentence':
            $prev = $curr.prevUntil('.stop'); // what if first sentence?
            $next = $curr.nextUntil('.stop');
            $selection = $curr.add($prev).add($next);
			$prevSpace = $selection.prev('.space');

            $toHighlight = $selection;
            break;
        case 'para':
			$selection = $curr.parents().filter(function() {
				return $(this).css('display') === 'block'; //how to handle tables and list items???
			}).first();
			$toHighlight = $selection.find('span');
            break;
    }

	if (GLOBAL.currentColour !== 'eraser') {
		removeHighlight($toHighlight);

		$toHighlight
			.addClass(GLOBAL.currentColour);

		if (GLOBAL.dragging) {
			$('.highlightable').on('mouseover', 'span', function () {
				$(this).addClass(GLOBAL.currentColour);
			});
		}
	} else {
		removeHighlight($toHighlight);
	}
}

function getSelection($span, start, end) {
	var $prev = $span.prevUntil('.' + start);
	var $next = $span.nextUntil('.' + end);

	return $span.add($prev).add($next);
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