const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
client.buttons = new Collection();
client.selects = new Collection();
client.modals = new Collection();

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

// Carregar componentes
const componentsPath = path.join(__dirname, 'components');
const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.js'));

for (const file of componentFiles) {
  const filePath = path.join(componentsPath, file);
  const component = require(filePath);
  if (component.data.name) {
    if (component.type === 'button') {
      client.buttons.set(component.data.name, component);
    } else if (component.type === 'select') {
      client.selects.set(component.data.name, component);
    }
  }
}

client.once('ready', async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);

  // Registrar slash commands
  const commands = client.commands.map(cmd => cmd.data.toJSON());
  
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log('✅ Comandos registrados no servidor');
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Comandos registrados globalmente');
    }
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  // Comandos
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar comando ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Erro ao executar comando!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Erro ao executar comando!', ephemeral: true });
      }
    }
  }

  // Botões
  if (interaction.isButton()) {
    const button = client.buttons.get(interaction.customId);
    if (!button) return;

    try {
      await button.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar botão ${interaction.customId}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Erro ao clicar no botão!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Erro ao clicar no botão!', ephemeral: true });
      }
    }
  }

  // Select menus
  if (interaction.isStringSelectMenu()) {
    const select = client.selects.get(interaction.customId);
    if (!select) return;

    try {
      await select.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar select ${interaction.customId}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Erro ao selecionar opção!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Erro ao selecionar opção!', ephemeral: true });
      }
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
