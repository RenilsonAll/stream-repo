// Função para inicializar o player de áudio
function initAudioPlayer(containerId) {
  const container = document.getElementById(containerId);
  const wrapper = container.querySelector("#audioPlayerWrapper");
  const toggleBtn = container.querySelector("#toggleBtn");


  const audioPlayer = container.querySelector("#audioPlayer");
  const audioListUl = container.querySelector("#audioList");
  const prevBtn = container.querySelector("#prevBtn");
  const nextBtn = container.querySelector("#nextBtn");

  let audios = [];
  let currentAudioIndex = 0;

  toggleBtn.onclick = () => {
    wrapper.classList.toggle("collapsed");
  };


  // Carrega lista de músicas do servidor
  fetch("/audio/list")
    .then(resp => resp.json())
    .then(list => {
      audios = list;
      if (audios.length > 0) loadAudio();
      renderAudioList();
    })
    .catch(err => console.error("Erro ao carregar lista de áudios:", err));

  function renderAudioList() {
    audioListUl.innerHTML = "";
    audios.forEach((audio, index) => {
      const li = document.createElement("li");
      li.textContent = audio;
      li.classList.toggle("active", index === currentAudioIndex);
      li.onclick = () => { currentAudioIndex = index; loadAudio(); };
      audioListUl.appendChild(li);
    });
  }

  function loadAudio() {
    audioPlayer.src = `/audio/${audios[currentAudioIndex]}`;
    audioPlayer.play();
    renderAudioList();
  }

  nextBtn.onclick = () => { currentAudioIndex = (currentAudioIndex + 1) % audios.length; loadAudio(); };
  prevBtn.onclick = () => { currentAudioIndex = (currentAudioIndex - 1 + audios.length) % audios.length; loadAudio(); };
  audioPlayer.onended = () => { nextBtn.onclick(); };
}
