var GLOBAL = {};

GLOBAL.currentColour = 'yellow';
GLOBAL.dragging = true;
GLOBAL.pens = [];
GLOBAL.penLabels = [];
GLOBAL.penColours = ['yellow', 'green', 'pink', 'blue', 'orange' , 'red'];
GLOBAL.eraser = true;
GLOBAL.markSpaces = false;
GLOBAL.markPunctuation = false;

GLOBAL.initialGenerate = true;
GLOBAL.$spans = null;
GLOBAL.$tiny = null;

//GLOBAL.uploadedJSON = null;

var stops = {
	character: [''],
	sentence: ['stop'],
	word: ['comma', 'stop', 'space']
};


$.getJSON('data.json', function(json) { //to be replaced with VLE.getAttachment
	$(document).ready(function() {
		if ($('title').text() !== 'Highlighting tool') {
			console.log('Not in the tool!');

			setGlobalFromJSON(json);
			initActivity();

			var buttonHTML = getButtonHTML(GLOBAL.pens);
			$('.buttons').html(buttonHTML);
		}

		$('.highlightable').on('mousedown', 'span:not(.nohighlight)', highlight);
		$('.highlightable').on('mouseleave mouseup', function() { $('.highlightable').off('mouseover', 'span'); });
		$('.highlightable').on('selectstart', function(e) { e.preventDefault(); });
		$('#check').on('click', checkAnswer);
		$('#reveal').on('click', revealAnswer);
		$('.reset').on('click', reset);
		$('.buttons').on('click', 'div', selectPen);
	});

});


//if previous word/sentence/block highlighted in SAME colour highlight space and punctuation?
//define blocks first?

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

function getButtonHTML(pens) {
	var pens = pens || GLOBAL.penColours;
	var buttonHTML = '';

	$.each(pens, function(i, val) {
		buttonHTML += '<div id="' + val + '_pen" class="colourbutton" tabindex="1"><img alt="' + val + ' highlighter pen" src="images/' + val + '1.jpg" /></div>';
	});

	buttonHTML += '<div id="eraser" class="eraserdiv" tabindex="1"><img src="images/eraser_load.jpg" alt="eraser" /></div>';

	return buttonHTML;
}

function highlight() {
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
	$.each(GLOBAL.penColours, function(i, val) {
		$s.removeClass(val);
	});

	console.log($s);
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