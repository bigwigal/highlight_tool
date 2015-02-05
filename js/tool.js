$(document).ready(function() {
    initTiny();

    $('#highlight_tab .buttons').html(getButtonHTML());

    $('#highlight_tab .buttons div:not(#eraser)').append('<textarea name="pen_label" rows="2" />');

    GLOBAL.highlightType = $('select[name="type"] option:selected').val();
    GLOBAL.spaceSelection = $('select[name="space_selection"] option:selected').val();

    //console.log(GLOBAL);

    $('a[href="#highlight_tab"]').on('show.bs.tab', generateText);
    $('a[href="#highlight_tab"]').on('hide.bs.tab', saveHighlightData);
    $('a[href="#editor_tab"]').on('show.bs.tab', editText);
    $('a[href="#preview_tab"]').on('show.bs.tab', generatePreview);
    $('#generate').on('click', generateJSON);
    $('#data').on('change', handleFileSelect);
    $('#upload').on('click', uploadJSON);

    $('select[name="space_selection"]').on('change', handleSpaces);
    $('input[name="sample"]').on('click', function() { GLOBAL.$tiny.html($('#sample_html').html()); });
    $('input[name="drag"]').on('change', function() { GLOBAL.dragging = !GLOBAL.dragging; });
    $('input[name="eraser"]').on('change', function() { GLOBAL.eraser = !GLOBAL.eraser; });
    $('input[name="spaces"]').on('change', function() { GLOBAL.markSpaces = !GLOBAL.markSpaces; });
    $('input[name="punctuation"]').on('change', function() { GLOBAL.markPunctuation = !GLOBAL.markPunctuation; });
    $('select[name="type"]').on('change', function() { GLOBAL.highlightType = $(this).val(); });

});

function initTiny() {
    GLOBAL.$tiny = $('#tiny textarea');

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
            ed.on('change', function(e) {
                console.log('tiny changed');
            });
        }
    });

    //GLOBAL.$tiny.html($('#sample_html').html());
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

function classNonAlphaNumericChars() {
    var specialChars = {
        space: ' ',
        stop: '.',
        comma: ',',
        semi: ';',
        colon: ':'
    };

    GLOBAL.$spans.each(function() {
        var s = this;

        $.each(specialChars, function(key, val) {
            if (s.innerHTML === val && !$(s).hasClass(key)) {
                s.className += key;
            }
        });
    });
}

function saveHighlightData() {
    var $questionText = $('#highlight').clone();

    GLOBAL.pens = getPensInUse();

    $.each(GLOBAL.pens, function(i, val) {
        $questionText.find('span').removeClass(val);
    });

    GLOBAL.question = encodeURI($questionText.html());
    GLOBAL.answer = encodeURI($('#highlight').html());

    //console.log(GLOBAL);
}

function generatePreview() {
    var buttonHTML = getButtonHTML(GLOBAL.pens);

    $('#preview_tab .buttons').html(buttonHTML);

    initActivity();
}


//Text editor hide - save html to GLOBAL.$tiny (don't allow unless data to save)
//Text editor show - populate with GLOBAL.answer || GLOBAL.$tiny if not set?? Encoding???

//Highlight hide - save all related data to GLOBAL
//Highlight show - load data

//Preview show - load data

//Upload - events on buttons only.


function generateText() {
    var tinyHTML = GLOBAL.$tiny.html();

    $('a[href="#preview_tab"]').parent().removeClass('disabled');

    $('#highlight').html(tinyHTML);

    spanCharacters('#highlight');
    classNonAlphaNumericChars();

    if (GLOBAL.initialGenerate) {
        $('a[href="#preview"]').parent().removeClass('disabled');
        GLOBAL.initialGenerate = false;
    }
}

function editText() {
    //var highlightHTML = $('#highlight').html();

    GLOBAL.$tiny.html(decodeURI(GLOBAL.answer));
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
    //setGlobalFromJSON(GLOBAL.uploadedJSON);
    var uploadedJSON = $(e.target).data('json');

    setGlobalFromJSON(uploadedJSON);

    console.log(GLOBAL);
}

function getPensInUse() {
    var pensUsed = [];

    $.each(GLOBAL.penColours, function(i, val) {
        if ($('.' + val).length > 0) {
            pensUsed.push(val);
        }
    });

    return pensUsed;
}

function handleSpaces(e) {
    var $spaces = $('.space');

    console.log($spaces);

    if (e.target.value === 'manual') {
        $spaces.removeClass('noevents');
    }
    else {
        removeHighlight($spaces);
        $spaces.addClass('noevents');
    }
}







function addSpans() {
    $('.highlightable').each(function () {
        var html = this.innerHTML;
        var spanned = '';
        var htmlChar = false;

        for (i = 0; i < html.length; i++) {
            var character = html.charAt(i);

            console.log(character);

            // Already spanned???????
            // Find anything outside of a span????

            if (character === '<') {
                htmlChar = true;
            }

            if (!htmlChar) {
                var span = '<span>' + character + '</span>';
                spanned += span;
            } else {
                spanned += character;
            }

            if (character === '>') {
                htmlChar = false;

                if (html.charCodeAt(i + 1) === 10) {
                    html = html.replace(html.charAt(i + 1), ''); //Replace LF as causing issues
                }
            }
        }

        this.innerHTML = spanned;
    });

    GLOBAL.$spans = $('.highlightable span');
}

function handleFileSelectOld(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        /*if (!f.type.match('image.*')) {
         continue;
         }*/

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                //GLOBAL.uploadedJSON = JSON.parse(e.target.result);

                $('#data_preview').html('<pre>' + e.target.result + '</pre>');
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsText(f);
    }
}

String.prototype.escapeSpecialChars = function() {
    console.log(this);
    return this.replace(/[\"]/g, '\\"')
        .replace(/[\\]/g, '\\\\')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t');
};