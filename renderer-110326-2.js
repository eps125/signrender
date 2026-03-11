(function(){
  const svgNS='http://www.w3.org/2000/svg';
  const XLINK='http://www.w3.org/1999/xlink';
  const GAP=30, EMBOLDEN=10;
  const OV2=1.25, OV3=1.10;

  const SIGNAL_COLORS = {
    White: '#ffffff',
    Green: '#519442',
    Yellow: '#f3ac52',
    Red: '#e73a39'
  };

  let signalSvgCache = new Map();

  async function ensureFonts(){
    if(document.fonts && document.fonts.load){
      await Promise.allSettled([
        document.fonts.load('400 400px GillSansExact'),
        document.fonts.load('700 400px GillSansExact'),
        document.fonts.load('400 200px BRLight'),
        document.fonts.load('400 48px "LEDDotMatrix"')
      ]);
      try{ await document.fonts.ready; }catch(e){}
    }
  }

  async function buildDigitSymbols(){
    if (window.__PS_ADV && document.getElementById('defs-host')) return window.__PS_ADV;

    await ensureFonts();
    let defsHost=document.getElementById('defs-host');
    if(!defsHost){
      const hidden=document.createElementNS(svgNS,'svg');
      hidden.setAttribute('width','0'); hidden.setAttribute('height','0');
      hidden.style.position='absolute'; hidden.style.left='-9999px'; hidden.style.top='-9999px';
      const defs=document.createElementNS(svgNS,'defs'); defs.id='defs-host';
      hidden.appendChild(defs); document.body.appendChild(hidden);
      defsHost=defs;
    }
    const meas=document.createElementNS(svgNS,'svg');
    meas.setAttribute('viewBox','0 0 900 900');
    meas.style.position='absolute'; meas.style.left='-9999px'; document.body.appendChild(meas);
    const adv={};
    for(let d=0; d<=9; d++){
      const t=document.createElementNS(svgNS,'text');
      t.textContent=String(d);
      t.setAttribute('x','0'); t.setAttribute('y','450');
      t.setAttribute('fill','#000'); t.setAttribute('stroke','#000'); t.setAttribute('stroke-width',EMBOLDEN);
      t.setAttribute('paint-order','stroke fill'); t.setAttribute('font-family','GillSansExact'); t.setAttribute('font-size','400');
      t.setAttribute('dominant-baseline','central'); t.setAttribute('text-anchor','start');
      meas.appendChild(t);
      await new Promise(r=>requestAnimationFrame(r));
      const bb=t.getBBox(); adv[d]=(isFinite(bb.width)&&bb.width>0)?bb.width:300; t.remove();

      const sym=document.createElementNS(svgNS,'symbol'); sym.id=`ps-digit-${d}`;
      const dt=document.createElementNS(svgNS,'text'); dt.textContent=String(d);
      dt.setAttribute('x','0'); dt.setAttribute('y','450'); dt.setAttribute('fill','#000');
      dt.setAttribute('stroke','#000'); dt.setAttribute('stroke-width',EMBOLDEN);
      dt.setAttribute('paint-order','stroke fill'); dt.setAttribute('font-family','GillSansExact'); dt.setAttribute('font-size','400');
      dt.setAttribute('dominant-baseline','central'); dt.setAttribute('text-anchor','start');
      sym.appendChild(dt); defsHost.appendChild(sym);
    }
    meas.remove();
    window.__PS_ADV = adv;
    return adv;
  }

  function buildDirPlateGroup(color='red'){
    const stroke = color==='yellow' ? 'var(--yellow)' : 'var(--red)';
    const gp=document.createElementNS(svgNS,'g');
    const rectFill=document.createElementNS(svgNS,'rect');
    rectFill.setAttribute('x','15'); rectFill.setAttribute('y','15'); rectFill.setAttribute('width','870'); rectFill.setAttribute('height','270');
    rectFill.setAttribute('rx','5'); rectFill.setAttribute('ry','5'); rectFill.setAttribute('fill','#fff');
    const rectStroke=document.createElementNS(svgNS,'rect');
    rectStroke.setAttribute('x','15'); rectStroke.setAttribute('y','15'); rectStroke.setAttribute('width','870'); rectStroke.setAttribute('height','270');
    rectStroke.setAttribute('rx','25'); rectStroke.setAttribute('ry','25'); rectStroke.setAttribute('fill','none');
    rectStroke.setAttribute('stroke', stroke); rectStroke.setAttribute('stroke-width','30'); rectStroke.setAttribute('stroke-linejoin','round');
    gp.appendChild(rectFill); gp.appendChild(rectStroke);
    return gp;
  }

  function placeArrow(group, codePoint, x, anchor){
    const g=document.createElementNS(svgNS,'g');
    g.setAttribute('transform',`translate(${x},150) scale(1.25) translate(${-x},-150)`);
    const t=document.createElementNS(svgNS,'text');
    t.textContent=String.fromCharCode(codePoint);
    t.setAttribute('x',x); t.setAttribute('y',150);
    t.setAttribute('fill','#000'); t.setAttribute('font-family','BRLight'); t.setAttribute('font-size','200');
    t.setAttribute('dominant-baseline','central'); t.setAttribute('text-anchor',anchor);
    g.appendChild(t); group.appendChild(g);
  }

  function _renderPS(container, speed, scale, dir, dirColor='red'){
    const s=String(speed); const isThree=s.length>=3; const oversize=isThree?OV3:OV2;
    const hasDir=(dir==='left'||dir==='right'||dir==='both');
    const totalH=hasDir?1250:900;

    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox',`0 0 900 ${totalH}`);
    if(scale){ svg.setAttribute('width',900*scale); svg.setAttribute('height',totalH*scale); }

    if(hasDir){
      const plateG=buildDirPlateGroup(dirColor); svg.appendChild(plateG);
      const ag=document.createElementNS(svgNS,'g'); svg.appendChild(ag);
      if(dir==='left')      placeArrow(ag,0x00E5,  50,'start');
      else if(dir==='right')placeArrow(ag,0x00DF, 850,'end');
      else { placeArrow(ag,0x00E5,50,'start'); placeArrow(ag,0x00DF,850,'end'); }
    }

    const discG=document.createElementNS(svgNS,'g'); if(hasDir) discG.setAttribute('transform','translate(0,350)');
    const face=document.createElementNS(svgNS,'circle');
    face.setAttribute('cx','450'); face.setAttribute('cy','450'); face.setAttribute('r','430');
    face.setAttribute('fill','#fff'); face.setAttribute('stroke','var(--red)'); face.setAttribute('stroke-width','40');
    discG.appendChild(face); svg.appendChild(discG);

    const nums=document.createElementNS(svgNS,'g');
    nums.setAttribute('transform',`translate(450,${hasDir?800:450}) scale(${oversize}) translate(-450,-450)`);
    svg.appendChild(nums);

    let total=0; for(const ch of s){ total += (window.__PS_ADV && isFinite(window.__PS_ADV[ch])) ? window.__PS_ADV[ch] : 300; }
    total += GAP*(s.length-1);
    let x=450-total/2;
    for(const ch of s){
      const use=document.createElementNS(svgNS,'use');
      use.setAttributeNS(XLINK,'xlink:href',`#ps-digit-${ch}`);
      use.setAttribute('href',`#ps-digit-${ch}`);
      use.setAttribute('x',x); use.setAttribute('y',0); nums.appendChild(use);
      x += ((window.__PS_ADV && isFinite(window.__PS_ADV[ch])) ? window.__PS_ADV[ch] : 300) + GAP;
    }

    container.innerHTML=''; container.appendChild(svg);
  }

  function _renderPSWI(container, speed, scale, dir){
    const s = String(speed);
    const isThree = s.length >= 3;
    const W = 900, H = isThree ? 1200 : 900;
    const hasDir = dir === 'left' || dir === 'right' || dir === 'both';
    const totalH = hasDir ? (300 + 50 + H) : H;

    const svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${totalH}`);
    if (scale){ svg.setAttribute('width', W*scale); svg.setAttribute('height', totalH*scale); }

    if (hasDir){
      const plateG = buildDirPlateGroup('yellow');
      svg.appendChild(plateG);
      const ag = document.createElementNS(svgNS,'g'); svg.appendChild(ag);
      if (dir === 'left')        placeArrow(ag, 0x00E5,  50, 'start');
      else if (dir === 'right')  placeArrow(ag, 0x00DF, 850, 'end');
      else { placeArrow(ag, 0x00E5, 50, 'start'); placeArrow(ag, 0x00DF, 850, 'end'); }
    }

    const body = document.createElementNS(svgNS,'g');
    if (hasDir) body.setAttribute('transform','translate(0,350)');
    svg.appendChild(body);

    const outline = document.createElementNS(svgNS,'path');
    outline.setAttribute('fill','#fff');
    outline.setAttribute('stroke','var(--yellow)');
    outline.setAttribute('stroke-width','40');
    outline.setAttribute('stroke-linejoin','round');
    if (!isThree){
      outline.setAttribute('d','M20 20 H880 L450 880 Z');
    } else {
      const zz = 395;
      outline.setAttribute('d',`M20 20 H880 V ${zz} L450 ${H-20} L20 ${zz} Z`);
    }
    body.appendChild(outline);

    const t = document.createElementNS(svgNS,'text');
    t.textContent = s;
    t.setAttribute('x','450');
    t.setAttribute('fill','#000');
    t.setAttribute('stroke','#000');
    t.setAttribute('stroke-width','10');
    t.setAttribute('paint-order','stroke fill');
    t.setAttribute('font-family','GillSansExact');
    t.setAttribute('font-size','315');
    t.setAttribute('text-anchor','middle');
    body.appendChild(t);

    requestAnimationFrame(()=>{
      const bb = t.getBBox();
      const top = 80;
      const dy = top - bb.y;
      t.setAttribute('y', dy);
      const f = isThree ? OV3 : OV2;
      if (f !== 1){
        const wrap = document.createElementNS(svgNS,'g');
        wrap.setAttribute('transform',`translate(450,${top}) scale(${f}) translate(-450,-${top})`);
        body.removeChild(t); wrap.appendChild(t); body.appendChild(wrap);
      }
    });

    container.innerHTML = '';
    container.appendChild(svg);
  }

  function _renderMU(container, speed, scale){
    const s = String(speed);
    const isThree = s.length >= 3;
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 900 900');
    if(scale){ svg.setAttribute('width',900*scale); svg.setAttribute('height',900*scale); }

    const disc=document.createElementNS(svgNS,'circle');
    disc.setAttribute('cx','450'); disc.setAttribute('cy','450'); disc.setAttribute('r','400');
    disc.setAttribute('fill','#fff'); disc.setAttribute('stroke','var(--red)'); disc.setAttribute('stroke-width','40'); svg.appendChild(disc);

    const label=document.createElementNS(svgNS,'text');
    label.textContent='MU'; label.setAttribute('x','450'); label.setAttribute('fill','#000');
    label.setAttribute('font-family','GillSansExact'); label.setAttribute('font-size','140'); label.setAttribute('stroke','#000'); label.setAttribute('stroke-width','6'); label.setAttribute('paint-order','stroke fill'); label.setAttribute('text-anchor','middle'); svg.appendChild(label);

    const digits=document.createElementNS(svgNS,'text');
    digits.textContent=s; digits.setAttribute('x','450'); digits.setAttribute('fill','#000');
    digits.setAttribute('stroke','#000'); digits.setAttribute('stroke-width','10'); digits.setAttribute('paint-order','stroke fill');
    digits.setAttribute('font-family','GillSansExact'); digits.setAttribute('font-size', isThree ? '330' : '370'); digits.setAttribute('text-anchor','middle'); svg.appendChild(digits);

    requestAnimationFrame(()=>{
      const topMU=55;  const bbL=label.getBBox(); label.setAttribute('y', topMU - bbL.y);
      const gL=document.createElementNS(svgNS,'g');
      gL.setAttribute('transform',`translate(450,${topMU}) scale(1.40) translate(-450,0)`);
      svg.removeChild(label); gL.appendChild(label); svg.appendChild(gL);

      const topNum = isThree ? 255 : 235;
      const bbD=digits.getBBox(); digits.setAttribute('y', topNum - bbD.y);
      const gD=document.createElementNS(svgNS,'g');
      gD.setAttribute('transform',`translate(450,${topNum}) scale(${isThree ? OV3 : 1.25}) translate(-450,-${topNum})`);
      svg.removeChild(digits); gD.appendChild(digits); svg.appendChild(gD);
    });

    container.innerHTML=''; container.appendChild(svg);
  }

  function _renderEPS(container, speed, scale){
    const s=String(speed);
    const svg=document.createElementNS(svgNS,'svg'); svg.setAttribute('viewBox','0 0 900 900');
    if(scale){ svg.setAttribute('width',900*scale); svg.setAttribute('height',900*scale); }

    const inner=document.createElementNS(svgNS,'rect');
    inner.setAttribute('x','20'); inner.setAttribute('y','20'); inner.setAttribute('width','860'); inner.setAttribute('height','860');
    inner.setAttribute('rx','10'); inner.setAttribute('fill','#fff'); svg.appendChild(inner);
    const stroke=document.createElementNS(svgNS,'rect');
    stroke.setAttribute('x','20'); stroke.setAttribute('y','20'); stroke.setAttribute('width','860'); stroke.setAttribute('height','860');
    stroke.setAttribute('rx','50'); stroke.setAttribute('fill','none'); stroke.setAttribute('stroke','#000'); stroke.setAttribute('stroke-width','40'); svg.appendChild(stroke);

    const disc=document.createElementNS(svgNS,'circle');
    disc.setAttribute('cx','450'); disc.setAttribute('cy','450'); disc.setAttribute('r','400');
    disc.setAttribute('fill','var(--yellow)'); disc.setAttribute('stroke','var(--red)'); disc.setAttribute('stroke-width','40'); svg.appendChild(disc);

    const label=document.createElementNS(svgNS,'text');
    label.textContent='EPS'; label.setAttribute('x','450'); label.setAttribute('fill','#000');
    label.setAttribute('font-family','BRLight'); label.setAttribute('font-size','140'); label.setAttribute('text-anchor','middle'); svg.appendChild(label);

    const digits=document.createElementNS(svgNS,'text');
    digits.textContent=s; digits.setAttribute('x','450'); digits.setAttribute('fill','#000');
    digits.setAttribute('stroke','#000'); digits.setAttribute('stroke-width','10'); digits.setAttribute('paint-order','stroke fill');
    digits.setAttribute('font-family','GillSansExact'); digits.setAttribute('font-size','370'); digits.setAttribute('text-anchor','middle'); svg.appendChild(digits);

    requestAnimationFrame(()=>{
      const topEPS=55;  const bbL=label.getBBox(); label.setAttribute('y', topEPS - bbL.y);
      const topNum=220; const bbD=digits.getBBox(); digits.setAttribute('y', topNum - bbD.y);

      const gL=document.createElementNS(svgNS,'g');
      gL.setAttribute('transform',`translate(450,${topEPS}) scale(1.40) translate(-450,0)`);
      svg.removeChild(label); gL.appendChild(label); svg.appendChild(gL);

      const gD=document.createElementNS(svgNS,'g');
      gD.setAttribute('transform',`translate(450,${topNum}) scale(1.25) translate(-450,-${topNum})`);
      svg.removeChild(digits); gD.appendChild(digits); svg.appendChild(gD);
    });

    container.innerHTML=''; container.appendChild(svg);
  }

  function _renderEPSWI(container, speed, scale){
    const s=String(speed);
    const W=900, H=900;
    const svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
    if(scale){ svg.setAttribute('width',W*scale); svg.setAttribute('height',H*scale); }

    const body=document.createElementNS(svgNS,'path');
    body.setAttribute('d','M20 20 H880 V600 L450 880 L20 600 Z');
    body.setAttribute('fill','var(--yellow)');
    body.setAttribute('stroke','#000');
    body.setAttribute('stroke-width','40');
    body.setAttribute('stroke-linejoin','round');
    body.setAttribute('stroke-linecap','round');
    svg.appendChild(body);

    const label=document.createElementNS(svgNS,'text');
    label.textContent='EPS'; label.setAttribute('x','450');
    label.setAttribute('fill','#000'); label.setAttribute('font-family','BRLight'); label.setAttribute('font-size','140');
    label.setAttribute('text-anchor','middle'); svg.appendChild(label);

    const digits=document.createElementNS(svgNS,'text');
    digits.textContent=s; digits.setAttribute('x','450');
    digits.setAttribute('fill','#000'); digits.setAttribute('stroke','#000'); digits.setAttribute('stroke-width','10'); digits.setAttribute('paint-order','stroke fill');
    digits.setAttribute('font-family','GillSansExact'); digits.setAttribute('font-size','370'); digits.setAttribute('text-anchor','middle'); svg.appendChild(digits);

    requestAnimationFrame(()=>{
      const topEPS=35;  const bbL=label.getBBox(); label.setAttribute('y', topEPS - bbL.y);
      const gL=document.createElementNS(svgNS,'g'); gL.setAttribute('transform',`translate(450,${topEPS}) scale(1.40) translate(-450,0)`); svg.removeChild(label); gL.appendChild(label); svg.appendChild(gL);

      const topNum=220; const bbD=digits.getBBox(); digits.setAttribute('y', topNum - bbD.y);
      const gD=document.createElementNS(svgNS,'g'); gD.setAttribute('transform',`translate(450,${topNum}) scale(1.25) translate(-450,-${topNum})`); svg.removeChild(digits); gD.appendChild(digits); svg.appendChild(gD);
    });

    container.innerHTML=''; container.appendChild(svg);
  }

  async function ensureSignRenderersReady(){
    await ensureFonts();
    await buildDigitSymbols();
  }

  async function loadSignalSvg(url) {
    if (!signalSvgCache.has(url)) {
      signalSvgCache.set(url, (async () => {
        const response = await fetch(new URL(url, document.baseURI));
        if (!response.ok) throw new Error(`Could not load signal SVG: ${url}`);
        return await response.text();
      })());
    }
    return await signalSvgCache.get(url);
  }

  function normalizeSignalConfig(config = {}) {
    const signalType = config.signalType || '4aspect';
    const aspect = ['None', 'R', 'Y', 'YY', 'FY', 'FYY', 'G'].includes(config.aspectDisplayed) ? config.aspectDisplayed : 'None';
    const ji = Array.isArray(config.ji) ? config.ji.slice(0, 6) : [];
    while (ji.length < 6) ji.push('None');

    const normalizeJiValue = (value) => ['None', 'White', 'Green', 'Yellow', 'Red'].includes(value) ? value : 'None';
    for (let i = 0; i < ji.length; i++) ji[i] = normalizeJiValue(ji[i]);

    if (ji[0] === 'None') { ji[1] = 'None'; ji[2] = 'None'; }
    if (ji[1] === 'None') { ji[2] = 'None'; }
    if (ji[3] === 'None') { ji[4] = 'None'; ji[5] = 'None'; }
    if (ji[4] === 'None') { ji[5] = 'None'; }

    const theatreColor = ['White', 'Green', 'Yellow', 'Red'].includes(config.theatreColor) ? config.theatreColor : 'White';
    const sanitizeSingle = (value) => (value || '').toString().trim().slice(0, 1).toUpperCase();

    let signalId = (config.signalId || '').toString().toUpperCase().replace(/\s+/g, ' ').trim();
    const match = signalId.match(/^([^\s]{1,4})\s([^\s]{1,4})$/);
    signalId = match ? `${match[1]} ${match[2]}` : '';

    return {
      signalType,
      aspectDisplayed: aspect,
      ji,
      bottomTheatreLeft: sanitizeSingle(config.bottomTheatreLeft),
      bottomTheatreRight: sanitizeSingle(config.bottomTheatreRight),
      theatreColor,
      signalId,
      svgPath: config.svgPath || './4aspectsignal.svg'
    };
  }

  function setNodeVisible(root, id, visible) {
    const node = root.querySelector(`#${CSS.escape(id)}`);
    if (!node) return;
    node.style.display = visible ? '' : 'none';
  }

  function applyFillToNode(node, fill) {
    if (!node) return;
    node.style.setProperty('fill', fill, 'important');
    node.setAttribute('fill', fill);
    node.querySelectorAll('*').forEach(child => {
      child.style.setProperty('fill', fill, 'important');
      child.setAttribute('fill', fill);
    });
  }

  function setTextNode(node, lines) {
    if (!node) return;
    node.textContent = '';
    lines.forEach((line, index) => {
      const tspan = document.createElementNS(svgNS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', index === 0 ? '0' : '16');
      tspan.textContent = line;
      node.appendChild(tspan);
    });
  }

  function applySignalState(svg, config) {
    const alwaysVisible = ['ZZZ_Width', 'Aspects', 'Signal_Base_Inner', 'Signal_Base_Outer'];
    const maybeHidden = [
      'R-2', 'Y-2', 'YY-2', 'FY', 'FYY', 'G-2',
      'ZZZ_L1',
      'Bottom_Left_Inner', 'Bottom_Left_Outer', 'Bottom_Left_Indication',
      'Bottom_Right_Inner', 'Bottom_Right_Outer', 'Bottom_Right_Indication',
      'Signal_ID_Left_Plate', 'Signal_ID_Left_Value'
    ];

    for (const id of alwaysVisible) setNodeVisible(svg, id, true);
    for (const id of maybeHidden) setNodeVisible(svg, id, false);

    for (let i = 1; i <= 6; i++) {
      setNodeVisible(svg, `F${i}_Base`, false);
      setNodeVisible(svg, `F${i}_Indication`, false);
      setNodeVisible(svg, `F${i}_Lights`, false);
    }

    const aspectMap = {
      R: 'R-2',
      Y: 'Y-2',
      YY: 'YY-2',
      FY: 'FY',
      FYY: 'FYY',
      G: 'G-2'
    };
    if (config.aspectDisplayed !== 'None' && aspectMap[config.aspectDisplayed]) {
      setNodeVisible(svg, aspectMap[config.aspectDisplayed], true);
    }

    const anyJiActive = config.ji.some(value => value !== 'None');
    setNodeVisible(svg, 'ZZZ_L1', anyJiActive);

    config.ji.forEach((value, index) => {
      const feather = index + 1;
      const active = value !== 'None';
      setNodeVisible(svg, `F${feather}_Base`, active);
      setNodeVisible(svg, `F${feather}_Indication`, active);
      setNodeVisible(svg, `F${feather}_Lights`, active);

      if (active) {
        const fill = SIGNAL_COLORS[value] || SIGNAL_COLORS.White;
        const lightsGroup = svg.querySelector(`#${CSS.escape(`F${feather}_Lights`)}`);
        applyFillToNode(lightsGroup, fill);
      }
    });

    const theatreFill = SIGNAL_COLORS[config.theatreColor] || SIGNAL_COLORS.White;
    const applyTheatre = (sideKey, text) => {
      const innerId = `Bottom_${sideKey}_Inner`;
      const outerId = `Bottom_${sideKey}_Outer`;
      const textId = `Bottom_${sideKey}_Indication`;
      const visible = !!text;
      setNodeVisible(svg, innerId, visible);
      setNodeVisible(svg, outerId, visible);
      setNodeVisible(svg, textId, visible);
      if (!visible) return;
      const node = svg.querySelector(`#${CSS.escape(textId)}`);
      if (!node) return;
      node.textContent = text;
      applyFillToNode(node, theatreFill);
      node.style.setProperty('fill', theatreFill, 'important');
      node.setAttribute('font-family', '"LEDDotMatrix", "LED Dot-Matrix", LEDDotMatrixRegular');
    };

    applyTheatre('Left', config.bottomTheatreLeft);
    applyTheatre('Right', config.bottomTheatreRight);

    const plateVisible = !!config.signalId;
    setNodeVisible(svg, 'Signal_ID_Left_Plate', plateVisible);
    setNodeVisible(svg, 'Signal_ID_Left_Value', plateVisible);

    if (plateVisible) {
      const [line1, line2] = config.signalId.split(' ');
      const textNode = svg.querySelector('#Signal_ID_Left_Value');
      const plateNode = svg.querySelector('#Signal_ID_Left_Plate');
      if (textNode) {
        const originalTspans = Array.from(textNode.querySelectorAll('tspan'));
        const line1Y = originalTspans[0]?.getAttribute('y') ?? '0';
        const line2Y = originalTspans[1]?.getAttribute('y') ?? '16';

        let centeredX = originalTspans[0]?.getAttribute('x') ?? '0';
        const transform = textNode.getAttribute('transform') || '';
        const translateMatch = transform.match(/translate\(([-+0-9.]+)[ ,]([-+0-9.]+)\)/);
        if (plateNode && translateMatch) {
          const textOriginX = parseFloat(translateMatch[1]);
          const plateX = parseFloat(plateNode.getAttribute('x') || '0');
          const plateWidth = parseFloat(plateNode.getAttribute('width') || '0');
          if (Number.isFinite(textOriginX) && Number.isFinite(plateX) && Number.isFinite(plateWidth)) {
            centeredX = String((plateX + (plateWidth / 2)) - textOriginX);
          }
        }

        textNode.textContent = '';
        textNode.setAttribute('text-anchor', 'middle');
        textNode.setAttribute('dominant-baseline', 'alphabetic');
        textNode.setAttribute('xml:space', 'preserve');

        const t1 = document.createElementNS(svgNS, 'tspan');
        t1.setAttribute('x', centeredX);
        t1.setAttribute('y', line1Y);
        t1.setAttribute('text-anchor', 'middle');
        t1.textContent = line1 || '';

        const t2 = document.createElementNS(svgNS, 'tspan');
        t2.setAttribute('x', centeredX);
        t2.setAttribute('y', line2Y);
        t2.setAttribute('text-anchor', 'middle');
        t2.textContent = line2 || '';

        textNode.appendChild(t1);
        textNode.appendChild(t2);
        textNode.setAttribute('font-family', 'GillSansExact, GillSansMT, "Gill Sans MT"');
        applyFillToNode(textNode, '#ffffff');
      }
    }
  }

  async function renderSignal(container, config = {}) {
    const normalized = normalizeSignalConfig(config);
    const svgText = await loadSignalSvg(normalized.svgPath);
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.nodeName.toLowerCase() !== 'svg') throw new Error('Signal SVG is invalid.');

    applySignalState(svg, normalized);

    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');
    svg.style.display = 'block';
    svg.style.maxWidth = '480px';
    svg.dataset.signalType = normalized.signalType;

    container.innerHTML = '';
    container.appendChild(document.importNode(svg, true));
  }

  function scanSigns(root){
    root = root || document;
    root.querySelectorAll('.sign').forEach(el=>{
      const type=(el.getAttribute('data-type')||el.getAttribute('data-kind')||'').toUpperCase();
      const scale=parseFloat(el.getAttribute('data-scale')||'0.075');
      const speed = el.getAttribute('data-speed') || el.getAttribute('data-ps') || '60';
      const dir=(el.getAttribute('data-dir')||'none').toLowerCase();
      if(type==='PS') _renderPS(el, speed, scale, dir);
      else if (type==='PSWI') _renderPSWI(el, speed, scale, dir);
      else if(type==='MU') _renderMU(el, speed, scale);
      else if(type==='EPS') _renderEPS(el, speed, scale);
      else if(type==='EPSWI') _renderEPSWI(el, speed, scale);
    });
  }

  window.renderPS   = function(el, s, scale, dir, dirColor){ _renderPS(el, s, scale, dir, dirColor); };
  window.renderPSWI = function(el, s, scale, dir){ _renderPSWI(el, s, scale, dir); };
  window.renderMU   = function(el, s, scale){ _renderMU(el, s, scale); };
  window.renderEPS  = function(el, s, scale){ _renderEPS(el, s, scale); };
  window.renderEPSWI= function(el, s, scale){ _renderEPSWI(el, s, scale); };
  window.renderSignal = renderSignal;
  window.normalizeSignalConfig = normalizeSignalConfig;
  window.ensureSignRenderersReady = ensureSignRenderersReady;
  window.rgScan = scanSigns;

  if (!window.__RG_RENDERERS_ONLY__) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', async () => { await ensureSignRenderersReady(); scanSigns(document); });
    else { (async ()=>{ await ensureSignRenderersReady(); scanSigns(document); })(); }
  }
})();
