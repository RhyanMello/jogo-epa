# EPA! RK Hunt

Jogo estilo Duck Hunt feito em HTML, JavaScript e Canvas puro, com visual pixel-art retrô e a logo da RK Informática e Games.

## Como jogar

```bash
npm start
```

Depois abra http://localhost:8080. Não precisa instalar nada além do Node. Também dá para abrir o `index.html` direto no navegador.

- Mire com o mouse e clique para atirar (no celular, toque na tela).
- Cada pássaro dá 3 tiros. Errou os 3 ou demorou, ele foge.
- São 10 pássaros por rodada. Acerte a meta (barra azul no placar) para passar de rodada.
- Pássaro preto vale 500, azul 1000 e vermelho 1500, multiplicado pela rodada. Acertar os 10 dá bônus.
- Tecla `M` liga e desliga o som.

## Arquivos

- `index.html`: página do jogo
- `game.js`: todo o jogo (sprites, sons, lógica)
- `server.js`: servidor local sem dependências
- `assets/logo-rk.png`: logo da RK
