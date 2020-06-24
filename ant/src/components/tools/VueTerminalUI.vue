<template>
  <div class="vue-terminal-container" ref="terminal">
    <div id="terminal" @keyup.ctrl="handleKey" ref="terminal">
      <!-- History -->
      <div id="history">
        <div
          v-for="(obj, key) in history"
          :key="key"
          class="line">
          <span
            v-if="obj.prefix"
            class="prefix">{{ obj.prefix }}</span>
          <span v-html="obj.content" />
        </div>
      </div>

      <!-- Bottom -->
      <div
        id="text"
        ref="text">
        <div
          v-if="prefix"
          class="prefix">
          {{ prefix }}
        </div>

        <div id="input">
          <span
            v-for="(char, key) in input"
            :key="key"
            :ref="`input-${key + 1}`"
            class>{{ (char === " ") ? "&nbsp;" : char }}</span>
          <span
            ref="input-0"
            class="cursor">_</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  //
  // Name
  //
  name: 'VueTerminalUI',

  //
  // Data
  //
  data: () => {
    return {
      input: '',
      history: [],
      commandsHistory: [],
      commandsHistoryIndex: 0,
      savedInput: '',
      cursorIndex: 0,
      inputLimit: 255,
      height: 0,
      width: 0
    };
  },

  //
  // Props
  //
  props: {
    prefix: {
      type: String,
      default: ''
    },
    noSplit: {
      type: Boolean,
      default: false
    },
    initMessage: {
      type: Array,
      default: () => []
    }
  },

  //
  // Methods
  //
  methods: {
    parseText (str) {
      return String(str)
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/ /g, '&nbsp;')
        .replace(/\n/g, '<br>')
        .replace(/((https?:\/\/)|(www\.))(\S+)/gi, (group) => {
          return `<a href="${group.startsWith('http') ? group : '//' + group}" target="_blank">${group}</a>`;
        });
    },

    styleAndColorText (str) {
      const colorHandler = (str) => {
        let colorTagFound = false;

        let colorParsed = str.replace(/\\color:((#[a-f0-9]{6})|(rainbow)|(none));/gi, (tag) => {
          let colorCode = tag.substring(7, tag.length - 1);
          let replaced;

          switch (tag.substring(7, tag.length - 1)) {
          case 'rainbow':
            replaced = (colorTagFound) ? `</span><span class='rainbow-text'>` : `<span class='rainbow-text'>`;
            break;
          case 'none':
            replaced = (colorTagFound) ? '</span>' : '';
            break;
          default:
            replaced = (colorTagFound) ? `</span><span style="color: ${colorCode};">` : `<span style="color: ${colorCode};">`;
            break;
          }
          colorTagFound = true;
          return replaced;
        });

        return (colorTagFound) ? colorParsed + '</span>' : colorParsed;
      };

      const styleHandler = (str) => {
        let lastStyleFound;

        let colorParsed = str.replace(/\\style:((bold)|(underline)|(strike)|(italic)|(none));/gi, (tag) => {
          let styleTag;

          switch (tag.substring(7, tag.length - 1)) {
          case 'bold':
            styleTag = 'strong';
            break;
          case 'underline':
            styleTag = 'ins';
            break;
          case 'strike':
            styleTag = 'del';
            break;
          case 'italic':
            styleTag = 'i';
            break;
          case 'none':
            var tmp = lastStyleFound;
            lastStyleFound = null;
            return `</${tmp}>`;
          }
          let replaced = (lastStyleFound) ? `</${lastStyleFound}><${styleTag}>` : `<${styleTag}>`;
          lastStyleFound = styleTag;
          return replaced;
        });

        return (lastStyleFound) ? colorParsed + `</${lastStyleFound}>` : colorParsed;
      };
      return colorHandler(styleHandler(str));
    },

    write (content, prefix = false) {
      let parsed = this.parseText(content);

      return new Promise((resolve, reject) => {
        this.history.push({
          prefix: prefix ? this.prefix : '',
          content: (prefix ? parsed : this.styleAndColorText(parsed)) || '&#8203;'
        });
        resolve();
      }).then(() => {
        this.$refs['text'].scrollIntoView(false);
      });
    },

    multiwrite (content, replace = false) {
      let writeArray = [];
      for (let i = 0; i < content.length; i++) {
        writeArray.push({
          prefix: '',
          content: this.styleAndColorText(this.parseText(content[i])) || '&#8203;'
        });
      }

      return new Promise((resolve, reject) => {
        if (!replace) {
          this.history = this.history.concat(writeArray);
        } else {
          this.history = this.history.slice(0, this.history.length - writeArray.length - 1).concat(writeArray);
        }
        resolve();
      }).then(() => {
        this.$refs['text'].scrollIntoView(false);
      });
    },

    clearInput () {
      this.write(this.input, true);
      this.updateInput('');
      this.savedInput = '';
      this.commandsHistoryIndex = 0;
      this.setCursor(0);
    },

    sendInput () {
      let savedInput = this.input;
      this.clearInput();

      if (savedInput.trim()) {
        this.commandsHistory.unshift(savedInput);

        if (this.noSplit) {
          this.$emit('triggerCommand', savedInput.trim(), []);
        } else {
          let commandArgs = savedInput.trim().split(/(?<!\\) /g);
          this.$emit('triggerCommand', commandArgs[0], commandArgs.splice(1, commandArgs.length));
        }
      }
    },

    paste (str) {
      let pastedText = str.replace(/\t/g, '');

      // if (this.input.length >= this.inputLimit) return;
      // if (this.input.length + pastedText.length >= this.inputLimit)
      //   pastedText = pastedText.substring(0, this.inputLimit - this.input.length);

      this.writeToInput(pastedText);
    },

    setCursor (index, retried = false) {
      const getRef = i => {
        return (this.$refs[`input-${i}`] && this.$refs[`input-${i}`].length) ? this.$refs[`input-${i}`][0] : this.$refs[`input-${i}`];
      };

      if (!getRef(index)) {
        if (!retried) {
          window.setTimeout(() => {
            this.setCursor(index, true);
          }, 5);
        }
        return;
      }

      getRef(this.cursorIndex).className = '';
      getRef(index).className = 'cursor';
      this.cursorIndex = index;
    },

    writeToInput (str) {
      let index =
        this.cursorIndex === 0 ? this.input.length : this.cursorIndex - 1;
      this.updateInput(
        this.input.substring(0, index) +
        str +
        this.input.substring(index, this.input.length)
      );
      this.addToCursor(str.length);
    },

    updateInput (str) {
      this.input = str;
      this.$emit('update:input', str);
    },

    addToCursor (nb) {
      let predict = this.cursorIndex + nb;
      let newIndex = this.cursorIndex;

      // If at the of the initial position
      if (this.cursorIndex === 0) {
        newIndex = predict === -1 ? this.input.length : 0;
      } else if (predict > this.input.length) { // If at the end of input then go to the initial cursor index
        newIndex = 0;
      } else if (predict < 1) { // If at the beggining of the input, stays here
        newIndex = 1;
      } else {
        newIndex += nb;
      }

      this.setCursor(newIndex);
    },

    handleKey (e) {
      const keyCode = e.keyCode;
      const printableKeys =
        (keyCode > 47 && keyCode < 58) || // number keys
        keyCode === 32 ||
        keyCode === 13 || // spacebar & return key(s) (if you want to allow carriage returns)
        (keyCode > 64 && keyCode < 91) || // letter keys
        (keyCode > 95 && keyCode < 112) || // numpad keys
        (keyCode > 185 && keyCode < 193) || // ;=,-./` (in order)
        (keyCode > 218 && keyCode < 223); // [\]' (in order)

      // space
      if (keyCode === 32) {
        e.preventDefault();
      }

      // ctrl-C
      if (e.ctrlKey && keyCode === 67) {
        this.clearInput();
      } else if ((e.metaKey && keyCode === 86) || (e.ctrlKey && keyCode === 86 && navigator.platform === 'Win32')) { // meta-V or ctrl-V for windows users
        navigator.clipboard.readText().then(text => {
          this.paste(text);
        });
      } else if (e.metaKey) { // meta-C

      } else if (keyCode === 13) { // Enter
        this.sendInput();
      } else if (keyCode === 8 || keyCode === 46) { // Backspace
        let backward = keyCode === 46 ? 0 : 1;
        let index =
          this.cursorIndex === 0
            ? this.input.length
            : this.cursorIndex - backward;
        let str = this.input;
        let part1 = str.substring(0, index - 1);
        let part2 = str.substring(index, str.length);
        this.updateInput(part1 + part2);

        if (this.cursorIndex === 0) {
          this.setCursor(0);
        } else {
          this.addToCursor(-backward);
        }
      } else if (keyCode === 37 || keyCode === 39) { // Arrow left/right
        this.addToCursor(keyCode === 37 ? -1 : 1);
      } else if (keyCode === 38) { // Arrow up
        e.preventDefault();
        let length = this.commandsHistory.length;
        if (!length) return;
        if (this.commandsHistoryIndex + 1 > length) { this.commandsHistoryIndex = length; } else this.commandsHistoryIndex++;
        this.updateInput(this.commandsHistory[this.commandsHistoryIndex - 1]);
        this.setCursor(0);
      } else if (keyCode === 40) { // Arrow down
        e.preventDefault();
        if (this.commandsHistoryIndex - 1 <= 0) {
          this.commandsHistoryIndex = 0;
          this.updateInput(this.savedInput);
        } else {
          this.updateInput(
            this.commandsHistory[--this.commandsHistoryIndex - 1]
          );
        }
        this.setCursor(0);
      } else if (keyCode === 35) { // End
        e.preventDefault();
        this.setCursor(0);
      } else if (keyCode === 36) { // Home
        e.preventDefault();
        this.setCursor(1);
      } else if (keyCode === 9) { // Tab
        // To do :
        // Make a better tabulation integration
        e.preventDefault();
        if (this.autoComplete() === false) {
          this.writeToInput(' '); //
        }
      } else if (printableKeys) { // Printable keys (a,b,c ...)
        // if (this.input.length >= this.inputLimit) return;
        this.writeToInput(e.key);
        if (this.commandsHistoryIndex > 0) { this.commandsHistory[this.commandsHistoryIndex - 1] = this.input; } else this.savedInput = this.input;
      }
    },

    autoComplete () {
      if (this.input.length < 1) {
        return false;
      }
      let cmds = this.input.split(' ');
      if (cmds.length > 1) {
        let cmd = cmds[0];
        let comd = cmds[1];
        switch (cmd) {
        case 'use':
          {
            let c = this.$store.getters.sexpServers;
            let serIds = [];
            for (let it in c) {
              if (c[it].runStatus === true) {
                serIds.push(it);
              }
            }
            let autoC = serIds.filter((v) => {
              return (v.indexOf(comd) === 0) && (v.indexOf('master') === -1);
            });
            if (autoC.length === 1) {
              this.updateInput(`use ${autoC[0]}`);
              return true;
            } else if (autoC.length > 1) {
              let msg = '\\color:#00CED1; ' + 'Use \n' + autoC.join(' ');
              this.$emit('write', msg);
              return true;
            }
          }
          break;
        }
      }
      return false;
    }
  },

  //
  // Mounted
  //
  mounted () {
    window.addEventListener('keydown', e => {
      this.handleKey(e);
    });

    this.$on('write', (data, overwrite = false) => {
      if (Array.isArray(data)) {
        this.multiwrite(data, overwrite);
      } else {
        this.write(data);
      }
    });

    this.$on('clearHistory', () => {
      this.history = [];
    });

    this.multiwrite(this.initMessage);
  }

  // watch: {
  //   this.$refs.terminal.clientHeight
  // }
};
</script>

<style>
a {
  color: inherit;
}

.vue-terminal-container {
  position: absolute;
  height: 100vh;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
}

#terminal {
  height: 100%;
  overflow-x: hidden;
  background-color: #292a35;
  color: #fff;
  font-family: monospace;
  padding: 0;
  margin: 0;
  padding-left: 6px;
  padding-bottom: 16px;
}

.prefix {
  float: left;
  margin-right: 6px;
}

#input,
.line {
  word-break: break-all;
  min-height: 1.2em;
}

label {
  display: inline-block;
}

section {
  margin: 0rem 0;
}

#input .cursor {
  background: #c7c7c7;
  color: #111;
  animation-name: blip;
  animation-duration: 1s;
  animation-iteration-count: infinite;
}

.rainbow-text {
  background: repeating-linear-gradient(85deg, red, orange, yellow, lime, cyan, purple, violet, red);
  text-align: center;
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow 3s linear 0s infinite;
}

@keyframes blip {
  0%, 49% {
    color: #111;
    background: #c7c7c7;
  }
  50%, 100% {
    background: inherit;
    color: #fff;
  }
}

@keyframes rainbow {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 75% 0%;
  }
  100% {
    background-position: 150% 0%;
  }
}
</style>
