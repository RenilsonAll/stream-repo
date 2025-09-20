const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 8000;

// Caminho absoluto para sua pasta de vídeos
const videosDir = "C:/Filmes/Y/L/BR"; // Windows
const audioBase = "C:/Filmes/Audio";

// Servindo frontend
app.use(express.static("public"));

// Lista vídeos disponíveis
app.get("/videos", (req, res) => {
  fs.readdir(videosDir, (err, files) => {
    if (err) return res.status(500).send("Erro ao listar vídeos");
    const mp4Files = files.filter(f => f.endsWith(".mp4"));
    res.json(mp4Files);
  });
});

// Rota para streaming progressivo
app.get("/video/:name", (req, res) => {
  const videoPath = path.join(videosDir, req.params.name);

  fs.stat(videoPath, (err, stats) => {
    if (err) return res.status(404).send("Vídeo não encontrado");

    const range = req.headers.range;
    if (!range) {
      // Se não houver Range, envia o arquivo inteiro
      res.writeHead(200, {
        "Content-Length": stats.size,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(videoPath).pipe(res);
      return;
    }

    // Parse do range, ex: "bytes=1000-"
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, head);
    file.pipe(res);
  });
});

app.get("/audio/list", (req, res) => {
  fs.readdir(audioBase, (err, files) => {
    if (err) return res.status(500).send("Erro ao listar áudios");

    // Filtra apenas arquivos .mp3
    const mp3Files = files.filter(f => f.toLowerCase().endsWith(".mp3"));
    res.json(mp3Files);
  });
});

app.use("/audio", (req, res) => {
  const audioRelPath = req.path.startsWith("/") ? req.path.slice(1) : req.path;
  const audioPath = path.resolve(audioBase, audioRelPath); // caminho absoluto real
  const baseResolved = path.resolve(audioBase);

  if (!audioPath.startsWith(baseResolved)) return res.status(403).send("Acesso negado");

  fs.stat(audioPath, (err, stats) => {
    if (err) return res.status(404).send("Áudio não encontrado");

    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, { "Content-Length": stats.size, "Content-Type": "audio/mpeg" });
      fs.createReadStream(audioPath).pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(audioPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    };
    res.writeHead(206, head);
    file.pipe(res);
  });
});


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
