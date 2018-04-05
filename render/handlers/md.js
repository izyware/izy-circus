var modtask = {};

// serialize methods serialize to html, etc.
modtask.serialize = function(pulse, params) {
  // gets set by parent
  var serializeMod = modtask.serializeMod;
  var str = '';
  if (!pulse.markdown1) {
    return str;
  }
  str += '<!-- izy markdown -->';
  str += (pulse.markdown1? '<div>' +  modtask.quickMdRender(pulse.markdown1) + '</div>' : '');
  return str;
}

modtask.quickMdRender = function(mdText) {
  function Stage1() {
    this.rules =  [
      {regex: /(#+)(.*)/g, replacement: header},
      {regex: /!\[([^\[]+)\]\(([^\)]+)\)/g, replacement: '<img src=\'$2\' alt=\'$1\'>'},
      {regex: /(\*\*|__)(.*?)\1/g, replacement: '<strong>$2</strong>'},
      {regex: /(\*|_)(.*?)\1/g, replacement: '<em>$2</em>'},
      {regex: /\~\~(.*?)\~\~/g, replacement: '<del>$1</del>'},
      {regex: /\:\"(.*?)\"\:/g, replacement: '<q>$1</q>'},
      {regex: /`(.*?)`/g, replacement: '<code>$1</code>'},
      {regex: /\n\*(.*)/g, replacement: ulList},
      {regex: /\n[0-9]+\.(.*)/g, replacement: olList},
      {regex: /\n(&gt;|\>)(.*)/g, replacement: blockquote},
      {regex: /\n-{5,}/g, replacement: '\n<hr />'},
      {regex: /\n([^\n]+)\n/g, replacement: para},
      {regex: /<\/ul>\s?<ul>/g, replacement: ''},
      {regex: /<\/ol>\s?<ol>/g, replacement: ''},
      {regex: /<\/blockquote><blockquote>/g, replacement: '\n'}
    ];
    this.addRule = function (regex, replacement) {
      regex.global = true;
      regex.multiline = false;
      this.rules.push({regex: regex, replacement: replacement});
    };

    // Render some Markdown into HTML.
    this.render = function (text) {
      text = '\n' + text + '\n';
      this.rules.forEach(function (rule) {
        text = text.replace(rule.regex, rule.replacement);
      });
      return text.trim();
    };

    function para (text, line) {
      var trimmed = line.trim();
      if (/^<\/?(ul|ol|li|h|p|bl)/i.test(trimmed)) {
        return '\n' + line + '\n';
      }
      return '\n<p>' + trimmed + '</p>\n';
    }

    function ulList (text, item) {
      return '\n<ul>\n\t<li>' + item.trim() + '</li>\n</ul>';
    }

    function olList (text, item) {
      return '\n<ol>\n\t<li>' + item.trim() + '</li>\n</ol>';
    }

    function blockquote (text, tmp, item) {
      return '\n<blockquote>' + item.trim() + '</blockquote>';
    }

    function header (text, chars, content) {
      var level = chars.length + 2;
      return '<h' + level + '>' + content.trim() + '</h' + level + '>';
    }
  }

  var html = '';
  try {
    html = (new Stage1()).render(mdText);
    var found = true;
    var linkMap = {};
    var scanStr = mdText;
    while (found) {
      found = scanStr.match(/\[([^\[]+)\]:\s*(.*)/);
      if (!found) break;
      linkMap[found[1]] = found[2];
      scanStr = scanStr.substr(found.index + found[0].length);
    }
    var p;
    for (p in linkMap) {
      html = html.replace(new RegExp('\\[' + p + '\\]', 'g'), '<a href="' + linkMap[p] + '">' + p + '</a>');
    }
  } catch(e) {
    html = '<!--- md5 render error !-->' + mdText;
  }
  return html;
}

// gateway methods take over the stream and control headers, etc.
modtask.gateway = function(push, params, viewModule) {}


