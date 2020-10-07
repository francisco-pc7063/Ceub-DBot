require('dotenv').config()
const fs = require('fs')
// Instanciando o bot.
const Discord = require('discord.js');
const bot = new Discord.Client();

// Configurações base <.env>
const token = process.env.API_TOKEN
const PREFIX = process.env.PREFIX
const ENV = process.env.ENV

// Obtendo demais recursos do projeto.
const { genLetterAsEmoji } = require('./src/utils/emoji-letters.js');
const { sendEmbed } = require('./src/utils/default-embeder');
const QuizzController = require('./src/controllers/quizz.controller.js');
const LivroController = require('./src/controllers/livro.controller.js');
const TopicoController = require('./src/controllers/topico.controller.js');
const DificuldadeController = require('./src/controllers/dificuldade.controller.js');
const livro = require('./src/assets/livro.json');
const { validarTopico } = require('./src/controllers/topico.controller.js');
bot.quizz = {};

//const joinEvent = require('./src/events/join.event') 
bot.on('ready', () => {
    console.log("=== BOT INICIADO ===");
    console.log("ENV:" ,ENV, "\nPREFIX:", PREFIX, "\n\n\n")
})


bot.on('message', msg => { // Evento dispara sempre que alguém manda uma mensagem.
    if ((!msg.author.bot) && (/windows|Windows|WINDOWS/.test(msg.content))) msg.channel.send(`Linux > Windows`)

    // Filtra mensagens de bot
    if (msg.author.bot) return
    // Filtra mensagem apenas para aqueles que começam com o prefixo correto
    if (msg.content.substring(0, PREFIX.length) !== PREFIX) return
    
    // Separação de argumentos para comandos com mais opções. $escolher 1 => args[0] escolher, args[1] => 1
    let args = msg.content.substring(PREFIX.length).split(" ");    
    try{
        bot.commands.get(args[0]).execute(msg);
    } catch(err) {
        switch(args[0].toLowerCase()) {
            case 'ler':
                if (!args[1]) {
                    sendEmbed(msg, 'ERROR', 'Campo Faltando', [
                        { name:'\u200B', value: '**Você precisa informar o campo de leitura.\n`!ler {topico}`**'}]);
                    break;
                }

                if (!validarTopico(livro, args[1])) 
                    sendEmbed(msg, 'ERROR', 'Campo Faltando', [
                        { name:'\u200B', value: '**Não foi possível encontrar esse tópico.\nUtilize o comando `!livro` para ver a lista de tópicos**'}]);
                else {
                    let paginaIndex = 1; // ESSE VALOR VIRIA DO BANCO DIZENDO QUAL FOI A ÚLTIMA PÁGINA ACESSADA.
                    let paginas = livro[topico].pages;
                    LivroController.sendPagina(msg, paginas, paginaIndex);
                }
                break;
            case 'quizz':
                let topico_list = [];
                let invalido_at = null;
                if (args[1]) {
                    // RETIRANDO TÓPICOS DO COMANDO, ARGS[0] É O INÍCIO DO COMANDO POR ISSO É FILTRADO.
                    topico_list = args.filter( (_, index) => index !== 0);
                    
                    // OBTENDO POSIÇÃO DE POSSÍVEL TÓPICO INVÁLIDO
                    invalido_at = TopicoController.obterTopicoInvalidoFromArray(livro, topico_list);

                    if (invalido_at !== null) {
                        sendEmbed(msg, 'ERROR', 'Tópico Inválido', [
                            { name:'\u200B', value: `Opa, parece que você se enganou agente, o tópico "${topico_list[invalido_at]}" não existe nos arquivos. \n\n** :gear:  Se quiser uma lista completa dos tópcios utilize o comando: :gear:\n\`!livro\`**`}]);      
                        break;
                    }
                }

                if (!bot.quizz[msg.channel.id]) {
                    const ALTERNATIVAS = [ genLetterAsEmoji('a'), genLetterAsEmoji('b'), genLetterAsEmoji('c'), genLetterAsEmoji('d')];
                    const dificuldades = DificuldadeController.obterDificuldadePorNivel(80);
                    let pContador = 0;
                    let perguntas = QuizzController.obterPerguntas(!invalido_at ? topico_list : null, dificuldades);
                    if (!perguntas) {
                        sendEmbed(msg, 'ERROR', 'Nenhuma Pergunta Encontrada', [
                            { name:'\u200B', value: `Opa, parece que não conseguimos encontrar perguntas para você.`}]);      
                        break;
                    }
                    bot.quizz[msg.channel.id] = true; // Setando quest como true.
                    
                    // =========> INICIAR QUIZZ <=========
                    QuizzController.handleQuizz(msg, bot, perguntas, perguntas.length, ALTERNATIVAS, pContador);
                }
                else 
                    msg.channel.send(`Já existe um quizz ocorrendo neste momento.`);
                break;
            default:
                console.log("NO OPTION FOR: '" + msg.content + "'")
                break;
        }
    }
    
    
});

bot.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    console.log("Importing file:", file)
    const command = require(`./src/commands/${file}`)
    bot.commands.set(command.name, command)
}




// Inicializando o bot.
bot.login(token);