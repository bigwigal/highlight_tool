config = {
    type: 'char',
    'space-selection': 'manual',
    'punct-selection': 'manual'


};


$('select[name="type"]').on('change', changeType); //TODO set standard configurations per type??
$('input[name="sample"]').on('click', function() { GLOBAL.$tiny.html($('#sample_html').html()); }).trigger('click');
$('input[name="drag"]').on('change', function() { GLOBAL.dragging = !GLOBAL.dragging; });
$('input[name="eraser"]').on('change', function() { GLOBAL.eraser = !GLOBAL.eraser; });
$('input[name="spaces"]').on('change', function() { GLOBAL.markSpaces = !GLOBAL.markSpaces; });
$('input[name="punctuation"]').on('change', function() { GLOBAL.markPunctuation = !GLOBAL.markPunctuation; });
$('input[name="pre"]').on('change', function() { GLOBAL.preHighlight = !GLOBAL.preHighlight; console.log(GLOBAL.preHighlight); });
$('input[name="space-selection"]').on('change', handleSpaces);