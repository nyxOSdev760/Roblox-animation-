// A phone screen drawn over the video (DOM, like the captions), for text-message and
// voice-message close-ups. Everything is driven by time, so any frame can be rendered alone.
//
//   const phone = createPhone({ contact: 'Ms. Parker' });
//   phone.update(t, { show, messages, status, menu, toast, voice });

const css = `
.phone { position: fixed; left: 50%; top: 52vh; width: 74vw; height: 64vh; transform: translate(-50%, -50%);
  background: #0b0b0d; border-radius: 6.5vw; padding: 1.6vw; box-shadow: 0 2vw 6vw rgba(0,0,0,0.55);
  font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; pointer-events: none; }
.phone .screen { position: relative; width: 100%; height: 100%; background: #ffffff; border-radius: 5vw; overflow: hidden; }
.phone .bar { height: 4.4vh; display: flex; justify-content: space-between; align-items: center; padding: 0 5vw;
  font-size: 3.4vw; font-weight: 600; color: #111; }
.phone .head { height: 9vh; border-bottom: 0.25vw solid #e4e4e8; display: flex; flex-direction: column; align-items: center;
  justify-content: center; background: #f7f7f9; }
.phone .avatar { width: 9vw; height: 9vw; border-radius: 50%; background: linear-gradient(#b8bec8, #8e96a3); color: #fff;
  font-size: 4.2vw; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.phone .name { font-size: 3.1vw; color: #111; margin-top: 0.6vh; }
.phone .chat { padding: 3vw 3.5vw; display: flex; flex-direction: column; gap: 1.4vh; }
.phone .msg { max-width: 72%; padding: 2.2vw 3.4vw; border-radius: 4.5vw; font-size: 4.3vw; line-height: 1.25; }
.phone .out { align-self: flex-end; background: #1f8bff; color: #fff; border-bottom-right-radius: 1.2vw; }
.phone .in { align-self: flex-start; background: #e9e9eb; color: #111; border-bottom-left-radius: 1.2vw; }
.phone .status { align-self: flex-end; font-size: 2.8vw; color: #8a8a8e; margin-top: -0.8vh; }
.phone .status b { color: #555; }
.phone .typing { align-self: flex-start; background: #e9e9eb; border-radius: 4.5vw; padding: 2.6vw 3.6vw; display: flex; gap: 1.2vw; }
.phone .typing i { width: 1.8vw; height: 1.8vw; border-radius: 50%; background: #9a9aa0; display: block; }
.phone .menu { position: absolute; right: 6vw; width: 42vw; background: rgba(250,250,252,0.97); border-radius: 3vw;
  box-shadow: 0 1vw 4vw rgba(0,0,0,0.25); overflow: hidden; font-size: 3.8vw; }
.phone .menu div { padding: 2.4vw 4vw; border-bottom: 0.2vw solid #e3e3e6; color: #111; }
.phone .menu .danger { color: #ff3b30; font-weight: 600; }
.phone .menu .hot { background: #e2e2e7; }
.phone .dim { position: absolute; inset: 0; background: rgba(0,0,0,0.25); }
.phone .toast { position: absolute; left: 6vw; right: 6vw; bottom: 5vh; background: #ff3b30; color: #fff; border-radius: 3vw;
  padding: 3vw; font-size: 3.9vw; font-weight: 700; text-align: center; }
.phone .voice { align-self: flex-end; background: #1f8bff; border-radius: 4.5vw; padding: 2.6vw 3.4vw; display: flex;
  align-items: center; gap: 2.4vw; width: 62%; }
.phone .play { width: 7vw; height: 7vw; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; }
.phone .play::after { content: ''; border-left: 2.4vw solid #1f8bff; border-top: 1.5vw solid transparent; border-bottom: 1.5vw solid transparent; margin-left: 0.6vw; }
.phone .play.on::after { border: none; width: 2.6vw; height: 2.6vw; background: linear-gradient(90deg, #1f8bff 35%, transparent 35% 65%, #1f8bff 65%); margin: 0; }
.phone .wave { flex: 1; display: flex; align-items: center; gap: 0.5vw; height: 7vw; }
.phone .wave span { flex: 1; background: rgba(255,255,255,0.45); border-radius: 0.5vw; }
.phone .wave span.done { background: #fff; }
.phone .dur { color: #fff; font-size: 3vw; }
.phone .speaker { align-self: center; margin-top: 3vh; font-size: 3.4vw; color: #8a8a8e; }
`;

export function createPhone({ contact = 'Contact', initials = '' } = {}) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.className = 'phone';
  document.body.appendChild(el);
  const bars = Array.from({ length: 34 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
  let last = '';

  return {
    /**
     * show: boolean; messages: [{ from: 'out' | 'in', text }]; status: text under the last
     * sent message; typing: show '...' bubble; menu: { at: index, hot: label } long-press menu;
     * toast: red banner text; voice: { progress 0..1, playing, seconds } voice-message bubble.
     */
    update(t, { show = false, messages = [], status = '', typing = false, menu = null, toast = '', voice = null } = {}) {
      el.style.display = show ? 'block' : 'none';
      if (!show) return;
      const key = JSON.stringify([messages, status, typing, menu, toast, voice && [Math.round(voice.progress * 34), voice.playing]]);
      if (key === last) return;
      last = key;
      const msgs = messages
        .map((m, i) => `<div class="msg ${m.from}"${menu && menu.at === i ? ' style="position:relative;z-index:2;transform:scale(1.04)"' : ''}>${m.text}</div>` +
          (status && i === messages.length - 1 && m.from === 'out' ? `<div class="status">${status}</div>` : ''))
        .join('');
      const voiceHtml = voice
        ? `<div class="voice"><div class="play ${voice.playing ? 'on' : ''}"></div><div class="wave">${bars
            .map((h, i) => `<span class="${i / bars.length < voice.progress ? 'done' : ''}" style="height:${h * 100}%"></span>`)
            .join('')}</div><div class="dur">0:0${voice.seconds ?? 3}</div></div>${voice.playing ? '<div class="speaker">🔊 Playing on speaker</div>' : ''}`
        : '';
      el.innerHTML = `<div class="screen">
        <div class="bar"><span>9:41</span><span>▂▄▆ ᯤ ▮</span></div>
        <div class="head"><div class="avatar">${initials || contact[0]}</div><div class="name">${contact} ›</div></div>
        <div class="chat">${msgs}${typing ? '<div class="typing"><i></i><i></i><i></i></div>' : ''}${voiceHtml}</div>
        ${menu ? `<div class="dim"></div><div class="menu" style="top:${26 + menu.at * 7}vh">${['Reply', 'Copy', 'Undo Send', 'Delete']
          .map((l) => `<div class="${l === 'Undo Send' || l === 'Delete' ? 'danger' : ''} ${menu.hot === l ? 'hot' : ''}">${l}</div>`)
          .join('')}</div>` : ''}
        ${toast ? `<div class="toast">${toast}</div>` : ''}
      </div>`;
    },
  };
}
