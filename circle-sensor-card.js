import { LitElement, html } from 'https://unpkg.com/lit-element@2.0.1/lit-element.js?module';

const styles = html`
    <style>
      :host {
        cursor: pointer;
      }
      .container {
        position: relative;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    .labelContainer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: 'var(--primary-text-color)';
    }
    #label {
      display: flex;
      line-height: 1;
    }
    #label.bold {
      font-weight: bold;
    }
    #label, #name {
      margin: 1% 0;
    }
    .text, #name {
      font-size: 100%;
    }
    .unit {
      font-size: 75%;
    }
    </style>
  `

class CircleSensorCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    }
  }
  
  get entity() {
    return this.hass.states[this.config.entity]
  }
  
  handleMore() {
    const e = new Event('hass-more-info', { bubbles: true, composed: true })
    e.detail = { entityId: this.entity.entity_id }
    this.dispatchEvent(e);
  }
  
  render() {
    const { name, attribute, fill, stroke_color, stroke_width, show_max, attribute_max, max, min, units, color_stops, font_style } = this.config;
    const { state, attributes: { unit_of_measurement }, } = this.entity;
    const state_ = attribute!==undefined ? state.attributes[attribute] : state;
    const r = 200 * .45;
    const min_ = min !==undefined ? min : 0;
    let stroke_ = stroke_color !==undefined ? stroke_color : '#03a9f4';
    const max_ = attribute_max !==undefined ? state.attributes[attribute_max] : (max !==undefined ? max : 100);
    const val = this._calculateValueBetween(min_, max_, state_);
    const score = val * 2 * Math.PI * r;
    const total = 10 * r;
    const dashArray = `${score} ${total}`;
    let colorStops = {};
    colorStops[min_] = stroke_color !==undefined ? stroke_color : '#03a9f4';
    if (color_stops!==undefined) {
      Object.keys(color_stops).forEach((key) => {
        colorStops[key] = color_stops[key];
      });
      stroke_ = this._calculateStrokeColor(state, colorStops);
    }
    let css = ''
    if (font_style!=undefined) {
      Object.keys(font_style).forEach((prop) => {
        css += `${prop}:${font_style[prop]};`
      });
    }
    
    return html`
      ${styles}
      <div class="container" id="container" @click="${() => this.handleMore()}" ?more-info="true">
        <svg viewbox="0 0 200 200" id="svg">
          <circle id="circle" cx="50%" cy="50%" r="45%"
            fill="${fill!==undefined ? fill : 'rgba(255, 255, 255, .75)'}"
            stroke="${stroke_}"
            stroke-dasharray="${dashArray}"
            stroke-width="${stroke_width !==undefined ? stroke_width : 6}" 
            transform="rotate(-90 100 100)"/>
        </svg>
        <span class="labelContainer" style="${css}">
          ${name !==undefined ? html`<span id="name">${name}</span>` : ''}
          <span id="label" class="${name !==undefined ? 'bold' : ''}">
            <span class="text">
              ${attribute !==undefined ? state.attributes[attribute] : state}
            </span>
            <span class="unit">
              ${show_max !==undefined
                ? html`&nbsp/ ${attribute_max !==undefined ? state.attributes[attribute_max] : max_ }`
                : (units !==undefined ? units : (unit_of_measurement !==undefined ? unit_of_measurement : '') )}
            </span>
          </span>
        </span>
      </div>
    `;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('error.missing_entity');
    }
    this.config = config;
  }

  getCardSize() {
    return 2;
  }
  
  _calculateValueBetween(start, end, val) {
    return (val - start) / (end - start);
  }
  
  _calculateStrokeColor(state, stops) {
    const sortedStops = Object.keys(stops).map(n => Number(n)).sort((a, b) => a - b);
    let start, end, val;
    const l = sortedStops.length;
    if (state <= sortedStops[0]) {
      return stops[sortedStops[0]];
    } else if (state >= sortedStops[l - 1]) {
      return stops[sortedStops[l - 1]];
    } else {
      for (let i = 0; i < l - 1; i++) {
        const s1 = sortedStops[i];
        const s2 = sortedStops[i + 1];
        if (state >= s1 && state < s2) {
          [start, end] = [stops[s1], stops[s2]];
          if (!this.config.gradient) {
            return start;
          }
          val = this._calculateValueBetween(s1, s2, state);
          break;
        }
      }
    }
    return this._getGradientValue(start, end, val);
  }

  _getGradientValue(colorA, colorB, val) {
    const v1 = 1 - val;
    const v2 = val;
    const decA = this._hexColorToDecimal(colorA);
    const decB = this._hexColorToDecimal(colorB);
    const rDec = Math.floor((decA[0] * v1) + (decB[0] * v2));
    const gDec = Math.floor((decA[1] * v1) + (decB[1] * v2));
    const bDec = Math.floor((decA[2] * v1) + (decB[2] * v2));
    const rHex = this._padZero(rDec.toString(16));
    const gHex = this._padZero(gDec.toString(16));
    const bHex = this._padZero(bDec.toString(16));
    return `#${rHex}${gHex}${bHex}`;
  }

  _hexColorToDecimal(color) {
    let c = color.substr(1);
    if (c.length === 3) {
      c = `${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
    }

    const [r, g, b] = c.match(/.{2}/g);
    return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
  }

  _padZero(val) {
    if (val.length < 2) {
      val = `0${val}`;
    }
    return val.substr(0, 2);
  }
}

customElements.define('circle-sensor-card', CircleSensorCard);
