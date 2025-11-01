# react-example
## First Example
https://codesandbox.io/ 에서 테스트 하기 위해서 만들었다.<br>
아래 처럼 https://codesandbox.io/s/github/<본인 GitHub ID>/<저장소 이름> 로 해야 한다. <br>
https://codesandbox.io/s/github/gracesjy/react-example


## Installation
Ubuntu
```
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
   source ~/.bashrc
   nvm install --lts
```
Windows
```
Windows에서는 Ubuntu처럼 직접 curl 명령어로 NVM(Node Version Manager)을 설치할 수는 없지만, Windows용 NVM인 를 사용하면 비슷한 방식으로 Node.js 버전을 관리할 수 있어요. 설치 방법은 다음과 같습니다:

🖥️ Windows에서 NVM 설치 방법 (nvm-windows)
- 설치 파일 다운로드
- nvm-windows GitHub Releases 페이지에서 최신 버전의 nvm-setup.exe를 다운로드합니다.
- 설치 실행
- nvm-setup.exe를 실행하여 설치합니다.
- 설치 중 Node.js 저장 경로와 NVM 경로를 설정할 수 있습니다. 기본값을 사용해도 무방합니다.
- 환경 변수 확인
- 설치 후 nvm 명령어가 작동하지 않으면, 시스템 환경 변수에 NVM 경로가 제대로 등록되었는지 확인하세요.
- Node.js 설치 및 사용
nvm install lts
nvm use lts
- 또는 특정 버전을 설치하려면:
nvm install 18.18.2
nvm use 18.18.2
- 설치된 버전 확인
nvm list



💡 참고로 nvm-windows는 WSL(Windows Subsystem for Linux) 환경에서는 작동하지 않으며, WSL에서는 Ubuntu 방식 그대로 설치하시면 됩니다.
혹시 WSL 환경에서 설치하고 싶으신 건가요, 아니면 일반 Windows 환경에서 Node.js를 관리하고 싶으신 건가요?

```
Get Source
```
   mkdir GitHub
   cd GitHub
   git clone https://github.com/gracesjy/react-example.git
   cd ~/GitHub/react-example
   npm install --save-dev vite
   npm install react-json-view --legacy-peer-deps
```
Run
```
   npm run dev
```
