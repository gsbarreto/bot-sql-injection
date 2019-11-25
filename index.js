const axios = require("axios");
const cheerio = require("cheerio");
const readline = require("readline");

let urlInicial = "http://testphp.vulnweb.com/";

let arrayLinks = [];
let linksVerificados = [];

const verificaForms = async link => {
  let newUrl = link;
  let protocol = "http://";
  if (newUrl.includes("http://")) {
    newUrl = newUrl.replace("http://", "");
  }
  if (newUrl.includes("https://")) {
    newUrl = newUrl.replace("https://", "");
    protocol = "https://";
  }

  newUrl = protocol + newUrl.substr(0, newUrl.indexOf("/"));
  try {
    const item = await axios.get(link);

    var $ = cheerio.load(item.data);
    const forms = $("form");

    $(forms).each(async (i, form) => {
      let action = $(form).attr("action");
      const method = $(form).attr("method");
      const inputNames = [];
      $(form)
        .find("input")
        .each((i, input) => {
          inputNames.push($(input).attr("name"));
        });
      if (action.substring(0, 1) === "/") {
        action = newUrl + action;
      } else {
        action = newUrl + "/" + action;
      }

      const obj = {};

      inputNames.map(item => {
        obj[item] = "%27";
      });

      const pagina = await axios({
        method: method,
        url: action,
        data: obj,
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Mobile Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
          Referer: action,
          "Accept-Encoding": "gzip, deflate",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          Origin: action,
          "Cache-Control": "max-age=0",
          Connection: "keep-alive"
        }
      });

      if (pagina.data.includes("You have an error in your SQL syntax")) {
        console.log("============================================");
        console.log("VULNERABILIDADE ENCONTRADA!");
        console.log("URL: ", action);
        console.log("PARAMETRO: ", parametro);
        console.log("============================================");
      }
    });
  } catch (err) {
    console.log("404 - Pagina não encontrada");
  }
};

verificaSQLInjection = async link => {
  if (link.includes("?") && link.includes("=")) {
    const parametro = link
      .split("?")
      .pop()
      .split("=")[0];
    const action =
      link.substring(0, link.indexOf("?")) + "?" + parametro + "=%27";

    try {
      const pagina = await axios({
        method: "get",
        url: action,
        data: {},
        header: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Mobile Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
          Referer: action,
          "Accept-Encoding": "gzip, deflate",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
          Origin: action,
          "Cache-Control": "max-age=0",
          Connection: "keep-alive"
        }
      });
      if (pagina.data.includes("You have an error in your SQL syntax")) {
        console.log("============================================");
        console.log("VULNERABILIDADE ENCONTRADA!");
        console.log("URL: ", action);
        console.log("PARAMETRO: ", parametro);
        console.log("============================================");
      }
    } catch (err) {
      console.log("404 - Página não encontrada");
    }
    await verificaForms(link);
  } else {
    await verificaForms(link);
  }
};

coletarLinks = async url => {
  let newUrl = url;
  let protocol = "http://";
  if (newUrl.includes("http://")) {
    newUrl = newUrl.replace("http://", "");
  }
  if (newUrl.includes("https://")) {
    newUrl = newUrl.replace("https://", "");
    protocol = "https://";
  }

  newUrl = protocol + newUrl.substr(0, newUrl.indexOf("/"));

  let siteInfo = url.split("/");
  siteInfo = siteInfo[2];

  arrayLinks = arrayLinks.filter(item => {
    return item !== url;
  });

  linksVerificados.push(url);

  let linksColetados = [];

  try {
    const page = await axios.get(url);

    var $ = cheerio.load(page.data);

    const links = $("a");

    await $(links).each((i, link) => {
      const href = $(link).attr("href");
      if (href.includes("http")) {
        if (href.includes(siteInfo)) {
          let count = 0;
          arrayLinks.map(item => {
            if (item === href) {
              ++count;
            }
          });
          linksVerificados.map(item => {
            if (item === href) {
              ++count;
            }
          });
          if (count === 0) {
            linksColetados.push(href);
          }
        }
      } else {
        if (
          !href.includes("mailto:") &&
          !href.includes("ftp:") &&
          href.substring(0, 1) !== "#" &&
          !href.includes("javascript:") &&
          !href.includes(".jpg")
        ) {
          let newHref = "";
          if (href.substring(0, 1) === "/") {
            newHref = newUrl + href;
          } else {
            newHref = newUrl + "/" + href;
          }

          let count = 0;
          arrayLinks.map(item => {
            if (item === newHref) {
              ++count;
            }
          });
          linksVerificados.map(item => {
            if (item === newHref) {
              ++count;
            }
          });
          if (count === 0) {
            linksColetados.push(newHref);
          }
        }
      }
    });

    return linksColetados;
  } catch (err) {
    return [];
  }
};

//Main code
(async () => {
  const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("===============================================");
  console.log("SQL Injection BOT");
  console.log("Alunos: Daniel Collione, Gabriel Barreto, Sidnei Aparecido");
  console.log("2019-2");
  console.log("===============================================");

  input.question("Digite o site a ser analisado: ", async resposta => {
    urlInicial = resposta;

    if (urlInicial.includes("http://") || urlInicial.includes("https://")) {
      arrayLinks = await coletarLinks(urlInicial);
      console.log("\nBuscando links no site...");
      console.log("\nItens iniciais:", arrayLinks.length);

      do {
        await Promise.all(
          await arrayLinks.map(async item => {
            const respostaArray = await coletarLinks(item);
            if (respostaArray.length > 0) {
              console.log(
                "Adicionado mais " + respostaArray.length + " links."
              );
            }
            arrayLinks.push(...respostaArray);
          })
        );
      } while (arrayLinks.length !== 0);

      console.log("\nLinks Encontrados:");
      console.log(linksVerificados);

      console.log("\nIniciando a verificação dos Inputs das paginas...\n");
      await Promise.all(
        await linksVerificados.map(async item => {
          console.log("Analinsando url", item);
          await verificaSQLInjection(item);
        })
      );
    } else {
      console.log("Url inválida");
    }

    input.close();
  });
})();
