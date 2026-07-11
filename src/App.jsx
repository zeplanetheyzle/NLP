import React, { useEffect, useRef } from 'react'

// 커서를 따라다니는 글로우 + 점 (glowRef로 외부 제어 가능)
function Cursor({ glowRef }) {
    const dot = useRef(null)
    const localGlow = useRef(null)
    const glow = glowRef || localGlow
    useEffect(() => {
        let gx = window.innerWidth / 2, gy = window.innerHeight / 2
        let dx = gx, dy = gy, raf
        const loop = () => {
            // 글로우는 부드럽게 추적, 점은 바로 따라옴
            gx += (mouseX - gx) * 0.15; gy += (mouseY - gy) * 0.15
            dx += (mouseX - dx) * 0.5; dy += (mouseY - dy) * 0.5
            if (glow.current) glow.current.style.transform = `translate(${gx}px, ${gy}px) scale(var(--gs, 1))`
            if (dot.current) dot.current.style.transform = `translate(${dx}px, ${dy}px)`
            raf = requestAnimationFrame(loop)
        }
        let mouseX = gx, mouseY = gy
        const move = (e) => { mouseX = e.clientX; mouseY = e.clientY }
        window.addEventListener('mousemove', move)
        raf = requestAnimationFrame(loop)
        return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
    }, [])
    return (
        <React.Fragment>
            <div className="cursor-glow" ref={glow} />
            <div className="cursor-dot" ref={dot} />
        </React.Fragment>
    )
}

// 커서 위치에 따라 기울어지는 카드
function TiltCard({ icon, tags, title, desc, links }) {
    const ref = useRef(null)
    const onMove = (e) => {
        const el = ref.current; if (!el) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        const rx = (0.5 - py) * 14, ry = (px - 0.5) * 14
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`
        el.style.setProperty('--mx', (px * 100) + '%')
        el.style.setProperty('--my', (py * 100) + '%')
    }
    const onLeave = () => { const el = ref.current; if (el) el.style.transform = '' }
    return (
        <div className="card" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
            <div className="spot" />
            <div className="icon">{icon}</div>
            {tags.map((t, i) => <span className="tag" key={i}>{t}</span>)}
            <h3>{title}</h3>
            <p>{desc}</p>
            {links.map((l, i) => <a key={i} href={l.href}>{l.label}</a>)}
        </div>
    )
}

function Stars() {
    const items = Array.from({ length: 60 }, () => ({
        left: Math.random() * 100, top: Math.random() * 100,
        delay: Math.random() * 3, op: Math.random(),
    }))
    return (
        <div className="stars">
            {items.map((s, i) => (
                <span key={i} style={{ left: s.left + 'vw', top: s.top + 'vh', animationDelay: s.delay + 's', opacity: s.op }} />
            ))}
        </div>
    )
}

// 상단 타이틀: 커서를 따라 기울어지고, 커서 위치에 빛이 비치며, 닿으면 커서 글로우가 커짐
function Title({ glowRef }) {
    const ref = useRef(null)
    const onMove = (e) => {
        const el = ref.current; if (!el) return
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        const rx = (0.5 - py) * 28, ry = (px - 0.5) * 28
        el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg)`
        el.style.setProperty('--mx', (px * 100) + '%')
        el.style.setProperty('--my', (py * 100) + '%')
        el.style.setProperty('--glow', '1')
    }
    const onEnter = () => { if (glowRef && glowRef.current) glowRef.current.style.setProperty('--gs', '1.8') }
    const onLeave = () => {
        const el = ref.current
        if (el) el.style.transform = ''
        el.style.setProperty('--glow', '0')
        if (glowRef && glowRef.current) glowRef.current.style.setProperty('--gs', '1')
    }
    return (
        <h1 ref={ref} onMouseMove={onMove} onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <span className="title-spot" aria-hidden="true">PROJECT<br />SHOWCASE</span>
            PROJECT<br />SHOWCASE
        </h1>
    )
}

function App() {
    const glowRef = useRef(null)
    useEffect(() => {
        const cards = document.querySelectorAll('.card')
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e, i) => {
                if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 90); io.unobserve(e.target) }
            })
        }, { threshold: 0.15 })
        cards.forEach((c) => io.observe(c))
    }, [])

    const projects = [
        { icon: '⚛️', tags: ['React', 'CSS'], title: '안녕하세요 인터랙션 데모',
            desc: 'React로 만든 버튼. 마우스를 올리면 뒤에서 빛이 퍼지는 hover glow 효과와 가이드 패널 토글을 구현했습니다.',
            links: [{ href: 'react-hello/index.html', label: '▶ 데모 열기' }] },
        { icon: '🎙️', tags: ['Python', 'K-means'], title: 'K-means 화자 분리',
            desc: 'MFCC 평균 벡터를 K-means로 군집하여 발화 구간별 화자를 분리하는 기본 파이프라인입니다.',
            links: [{ href: 'speaker_diarization.py', label: '▶ 코드 보기' }] },
        { icon: '🧠', tags: ['SpeechBrain', 'x-vector', 'K-means'], title: 'x-vector 화자 임베딩 분리',
            desc: 'SpeechBrain 사전학습 x-vector로 화자 임베딩을 추출하고 K-means로 군집해 정확도를 높인 버전 (.py + .ipynb).',
            links: [{ href: 'speaker_diarization_xvector.py', label: '▶ 코드 보기' }, { href: 'speaker_diarization_xvector.ipynb', label: '▶ Notebook' }] },
    ]
    const stack = ['Python', 'PyTorch', 'SpeechBrain', 'scikit-learn', 'librosa', 'React', 'HTML/CSS']

    return (
        <React.Fragment>
            <Cursor glowRef={glowRef} />
            <Stars />
            <header>
                <div className="badge">Portfolio</div>
                <Title glowRef={glowRef} />
                <p>NLP · 음성 처리 · 웹 프로토타입</p>
                <div className="scroll-hint">아래로 스크롤 ↓</div>
            </header>
            <main className="container">
                <h2 className="section-title">프로젝트</h2>
                <div className="grid">
                    {projects.map((p, i) => <TiltCard key={i} {...p} />)}
                </div>
                <h2 className="section-title">기술 스택</h2>
                <div className="stack">
                    {stack.map((s, i) => <span className="tag" key={i}>{s}</span>)}
                </div>
            </main>
            <footer>© 2026 · github.com/zeplanetheyzle</footer>
        </React.Fragment>
    )
}

export default App
