var GLOBAL = {
    highlightType: null,
    currentPen: 'yellow',
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
    spaceSelection: null,
    markSpaces: false,
    markPunctuation: false,

    //used in tool only...
    inTool: true,
    initialGenerate: true,
    $spans: null,
    $tiny: null,
    preHighlight: false
};

$(document).ready(function() {
    initTiny();

    $('#highlight_tab').find('.buttons').prepend(getButtonHTML());

    //$('#highlight_tab .buttons div:not(#eraser)').append('<textarea class="pen_label" rows="2" maxlength="25" />');
    $('.buttons').find('textarea').each(function() {
        maxLength(this);
    });

    //GLOBAL.highlightType = 'word';
    GLOBAL.highlightType = $('select[name="type"] option:selected').val();
    GLOBAL.spaceSelection = $('select[name="space_selection"] option:selected').val();
    //$('input[value="manual"]').prop('checked', true);

    //console.log(GLOBAL);

    //$('a[href="#highlight_tab"]').on('show.bs.tab', generateText);
    $('a[href="#editor_tab"]')
        .on('show.bs.tab', editText)
        .on('hide.bs.tab', saveTextData);
    $('a[href="#highlight_tab"]').on('hide.bs.tab', saveHighlightData);
    $('a[href="#preview_tab"]').on('show.bs.tab', generatePreview);
    $('#generate').on('click', generateJSON);
    $('#data').on('change', handleFileSelect);
    $('#upload').on('click', uploadJSON);

    $('select[name="type"]').on('change', changeType); //TODO set standard configurations per type??
    $('input[name="sample"]').on('click', function() { GLOBAL.$tiny.html($('#sample_html').html()); }).trigger('click');
    $('input[name="drag"]').on('change', function() { GLOBAL.dragging = !GLOBAL.dragging; });
    $('input[name="eraser"]').on('change', function() { GLOBAL.eraser = !GLOBAL.eraser; });
    $('input[name="spaces"]').on('change', function() { GLOBAL.markSpaces = !GLOBAL.markSpaces; });
    $('input[name="punctuation"]').on('change', function() { GLOBAL.markPunctuation = !GLOBAL.markPunctuation; });
    $('input[name="pre"]').on('change', function() { GLOBAL.preHighlight = !GLOBAL.preHighlight; console.log(GLOBAL.preHighlight); });
    $('input[name="space-selection"]').on('change', handleSpaces);
});

/**TODO check tab behaviour:
 Text editor hide - save html to GLOBAL.$tiny (don't allow unless data to save)
 Text editor show - populate with GLOBAL.answer || GLOBAL.$tiny if not set?? Encoding???
 Highlight hide - save all related data to GLOBAL
 Highlight show - load data
 Preview show - load data
 **/

//TODO CHECK: Upload - events on buttons only.
//TODO add prehighlight and distrator(?) options


function initTool() {}

function initTiny() {
    GLOBAL.$tiny = $('#tiny').find('textarea');

    GLOBAL.$tiny.tinymce({
        script_url : 'tinymce/tinymce.min.js',
        height: 400,
        verify_html : false,
        entity_encoding: 'raw',
        plugins: [
            'advlist autolink lists link image charmap print preview anchor',
            'searchreplace visualblocks code fullscreen',
            'insertdatetime media table contextmenu paste'
        ],
        toolbar: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | table | bullist numlist outdent indent | link image | code',
        setup: function(ed) {
            ed.on('change', function() {
                console.log('tiny changed');
            });
        }
    });
}

function spanCharacters(el) {
    $(el).contents().each(function() {
        if (this.nodeName.toLowerCase() !== 'span') {
            if (this.nodeType === 1) {
                spanCharacters(this);
            }
            else if (this.nodeType === 3) {
                var str = this.nodeValue;

                $(this).replaceWith($.map(str.split(''), function(c, i) {
                    var code = str.charCodeAt(i);

                    if (code === 9 || code === 10) {
                        return c;
                    }

                    return '<span>' + c + '</span>';
                }).join(''));
            }
        }
        else if (this.innerHTML.length > 1) {
            spanCharacters(this);

            $(this).contents().unwrap();
        }
    });

    GLOBAL.$spans = $('.highlightable span');
}

function spanBlocks(el) {
    var $block = $();
    var blockHTML = '<span class="block" tabindex="1"></span>';

    //TODO custom? - this could be done post markup (leave until preview and then grab what's marked up)??
    //TODO predefined - highlightable text limited - just needs to be a config setting (only highlighted text highlightable)

    //console.log(GLOBAL.highlightType);

    switch (GLOBAL.highlightType) {
        case 'char':
            //$(el).find('span').attr('tabindex', '1').addClass('block');
            $(el).find('span').not('.punct, .space').wrap(blockHTML);
            break;
        case 'word':
            $(el).find('span').each(function() {
                var $this = $(this);

                if (!$this.hasClass('space') && !$this.hasClass('punct') && !$this.is(':last-child')) {
                    $block = $block.add($(this));
                }
                else {
                    if ($this.is(':last-child') && !$this.hasClass('punct')) {
                        $block = $block.add($(this));
                    }

                    $block.wrapAll(blockHTML);
                    $block = $();
                }
            });
            break;
        case 'sentence':
            $(el).children().each(function() {
                if ($(this).css('display') !== 'inline') {
                    spanBlocks(this);
                }
                else {
                    var $parent = $(this).parent();
                    var $stops = $parent.find('.stop');
                    var noOfStops = $stops.length;

                    if (noOfStops > 1) {
                        $stops.each(function() {
                            var $stop = $(this);
                            var $stopParents = $stop.parents();

                            $stopParents.each(function(i) {
                                if ($(this).css('display') !== 'inline') {
                                    if (i > 0) {
                                        $stop = $stopParents.eq(i - 1); //first inline parent
                                    }

                                    $block = $stop.prevUntil('.block').addBack();

                                    if ($block.first().hasClass('space')) {
                                        $block = $block.not(':eq(0)');
                                    }

                                    $block.wrapAll(blockHTML);

                                    return false;
                                }
                            });
                        });
                    }
                    else {
                        $parent.wrapInner(blockHTML);
                    }
                    return false;
                }
            });
            break;
        case 'para':
            $(el).children().each(function() {
                if ($(this).css('display') !== 'inline') {
                    spanBlocks(this);
                }
                else {
                    $(this).parent().wrapInner(blockHTML);
                    return false;
                }
            });
            break;
    }
}

function removeBlocks(html) {
    var $html = html ? $('<div></div>').html(html) : $('#highlight');

    $html.find('.block').each(function() {
        $(this).children().unwrap();
    });

    return $html.html();
}

function changeType() { //TODO should each config have it's on object??
    var defaultSpaceSelection = {
        char: 'manual',
        word: 'auto',
        sentence: 'auto',
        para: 'not'
    };

    /*if (GLOBAL.highlightType === 'char') {
        $('#highlight').find('span').removeClass('.block');
    }
    else {
        $('#highlight').find('.block').each(function() {
            $(this).children().unwrap();
        });
    }*/

    //console.log(this.value);

    removeBlocks();

    GLOBAL.highlightType = this.value;

    //console.log(defaultSpaceSelection[GLOBAL.highlightType]);

    $('input[value="' + defaultSpaceSelection[GLOBAL.highlightType] + '"]').prop('checked', true).trigger('change');

    $('#highlight').find('span').removeAttr('tabindex');

    spanBlocks('#highlight')
}

function classNonAlphaNumericChars() {
    var specialChars = {
        space: ' ',
        stop: '.',
        comma: ',',
        semi: ';',
        colon: ':',
        quote: '\'',
        d_quote: '"',
        question: '?',
        exclamation: '!',
        l_bracket: '(',
        r_bracket: ')'
    };

    GLOBAL.$spans.each(function() {
        var s = this;
        var c = s.innerHTML;

        $.each(specialChars, function(key, val) {
            if (c === val && !$(s).hasClass(key)) {
                if (c !== ' ') {
                    $(s).addClass('punct');
                }
                $(s).addClass(key);
            }
        });
    });
}

function editText() {
    var html = removeBlocks(decodeURI(GLOBAL.answer));

    GLOBAL.$tiny.html(html);
}

function saveTextData() {
    GLOBAL.answer = encodeURI(GLOBAL.$tiny.html());

    //console.log(GLOBAL.$tiny.html());

    generateHighlightText();
}

function generateHighlightText() { //TODO set this to only fire when leaving editor??
    //var tinyHTML = GLOBAL.$tiny.html();
    var tinyHTML = decodeURI(GLOBAL.answer);

    GLOBAL.inTool = true;

    $('a[href="#preview_tab"]').parent().add('#preview_tab').removeClass('disabled');

    $('#highlight').html(tinyHTML);

    spanCharacters('#highlight');
    classNonAlphaNumericChars();
    spanBlocks('#highlight');

    if (GLOBAL.initialGenerate) {
        $('input[name="space-selection"]').filter(':checked').trigger('change');
        $('a[href="#preview"]').parent().removeClass('disabled');
        GLOBAL.initialGenerate = false;
    }
}

function saveHighlightData() {
    var $questionText = $('#highlight').clone();
    var pensUsed = getPensInUse();

    $.each(pensUsed, function(key) {
        //$questionText.find('span').removeClass(key);
        $questionText.find('span.' + key).each(function() {
            var $this = $(this);

            if (!$this.hasClass('prehighlight')) {
                $this.removeClass(key);
            }
        })
    });

    GLOBAL.question = encodeURI($questionText.html());
    GLOBAL.answer = encodeURI($('#highlight').html());

    $('.pen_label').each(function() {
        var labelText = '';
        var penColour = this.parentNode.id.replace('_pen', '');

        if (GLOBAL.pens[penColour]) {
            if (this.value.length > 0) {
                labelText = this.value;
            }

            GLOBAL.pens[penColour]['label'] = labelText;
        }
    });

}

//write isPenInUse()

function generatePreview() {
    var $preview = $('#preview_tab');

    GLOBAL.inTool = false;

     $('input[name="pre"]').trigger('change').prop('checked', false);

    $preview.find('.buttons').html(getButtonHTML());
    $preview.find('#question').html(decodeURI(GLOBAL.question));
    $preview.find('#answer').html(decodeURI(GLOBAL.answer));
}

function generateJSON() {
    var data = {};

    data.dragging = GLOBAL.dragging;
    data.eraser = GLOBAL.eraser;
    data.spaceSelection = GLOBAL.spaceSelection;
    data.markSpaces = GLOBAL.markSpaces;
    data.markPunctuation = GLOBAL.markPunctuation;
    data.pens = GLOBAL.pens;
    data.question = GLOBAL.question;
    data.answer = GLOBAL.answer;

    try {
        //var isFileSaverSupported = !!new Blob;
        var blob = new Blob([JSON.stringify(data, null, 4)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, 'data.json');
    } catch (e) {
        var wnd = window.open('', 'Highlighting data', '_blank');
        wnd.document.write(JSON.stringify(data, null, 4));
    }
}

function handleFileSelect(e) {
    var files = e.target.files;
    var reader = new FileReader();

    reader.onload = (function() {
        return function(e) {
            $('#upload').data('json', JSON.parse(e.target.result));

            //GLOBAL.uploadedJSON = JSON.parse(e.target.result);

            $('#data_preview').html('<pre>' + e.target.result + '</pre>');
        };
    })(files[0]);

    reader.readAsText(files[0]);
}

function uploadJSON(e) {
    var uploadedJSON = $(e.target).data('json');

    //TODO parse json to check it has correct properties?
    setGlobalFromJSON(uploadedJSON);

    //console.log(GLOBAL);
}

function getPensInUse() {
    $.each(GLOBAL.allPens, function(key, val) {
        if ($('#highlight .' + key).length > 0) {
            GLOBAL.pens[key] = val;
        }
    });

    return GLOBAL.pens;
}

function handleSpaces(e) {
    var $spaces = $('.space');

    console.log(e.target.value);

    GLOBAL.spaceSelection = e.target.value;

    if (GLOBAL.spaceSelection === 'auto') {
        var currentPen = GLOBAL.currentPen;
        var pens = getPensInUse();

        for (var key in pens) {
            GLOBAL.currentPen = key;

            autoSelectSpaces($('.block.' + GLOBAL.currentPen));
        }

        GLOBAL.currentPen = currentPen;
    }
    else if (GLOBAL.spaceSelection === 'manual') {
        $spaces.attr('tabindex', '1');
    }
    else {
        removeHighlight($spaces);
        $spaces.removeAttr('tabindex');
    }
}

function maxLength(el) {
    if (!('maxLength' in el)) {
        var max = el.attributes.maxLength.value;
        el.onkeypress = function () {
            if (this.value.length >= max) return false;
        };
    }
}