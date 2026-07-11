# 정혜원 · Portfolio

NLP / 음성 처리 / 웹 프로토타입 실습 포트폴리오입니다.

## 포함된 프로젝트

### 1. 안녕하세요 인터랙션 데모 (`react-hello/`)
React(CDN 단일 파일)로 만든 데모 페이지입니다.
- "안녕하세요" 버튼에 마우스를 올리면 뒤에서 빛이 퍼지는 **hover glow** 효과
- 버튼 클릭 시 "뭐 어떻게 하는" 가이드 패널이 토글(`useState`)

브라우저로 `react-hello/index.html`을 열면 바로 동작합니다.

### 2. K-means 화자 분리 (`speaker_diarization.py`)
가장 기본적인 화자 분리 파이프라인입니다.
1. 오디오 로드 (librosa, 16kHz)
2. MFCC 특징 추출 → 세그먼트 평균 벡터
3. K-means로 세그먼트를 K명의 화자로 군집
4. 시간 구간별 화자 라벨 출력

```bash
pip install numpy librosa scikit-learn
python speaker_diarization.py audio.wav 2
```

### 3. x-vector + K-means 화자 분리 (`speaker_diarization_xvector.py` / `.ipynb`)
사전학습 **SpeechBrain x-vector** 모델로 화자 임베딩을 추출한 뒤 K-means로 군집하여
MFCC 평균 방식보다 정확도를 높인 버전입니다. Jupyter Notebook 데모(합성 오디오 + PCA 시각화)도 포함합니다.

```bash
pip install numpy torchaudio speechbrain
python speaker_diarization_xvector.py audio.wav 2
```

Notebook 실행:
```bash
jupyter notebook speaker_diarization_xvector.ipynb
```

## 기술 스택
- Python, PyTorch, SpeechBrain, scikit-learn, librosa
- React, HTML/CSS

## 라이선스
교육/포트폴리오 목적의 개인 프로젝트입니다.
