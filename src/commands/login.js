const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { UserDB, HistoryDB } = require('../utils/database');
const QuestAPI = require('../utils/questAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('login')
    .setDescription('Autentique-se com seu token do Discord')
    .addStringOption(option =>
      option
        .setName('token')
        .setDescription('Seu token de acesso do Discord')
        .setRequired(true)
        .setSecret(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const token = interaction.options.getString('token');
    const discordId = interaction.user.id;

    try {
      // Validar token
      const questAPI = new QuestAPI(token);
      const userInfo = await questAPI.validateToken();

      // Salvar token no banco de dados
      await UserDB.save(discordId, token);

      // Registrar ação no histórico
      await HistoryDB.log(discordId, 'login', null, 'success');

      // Criar embed de sucesso
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Autenticação Bem-Sucedida!')
        .setDescription(`Bem-vindo, **${userInfo.username}**!`)
        .addFields(
          { name: '👤 ID do Discord', value: `\`${userInfo.id}\``, inline: true },
          { name: '🔐 Status', value: 'Autenticado', inline: true },
          { name: '⏰ Timestamp', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
        )
        .setFooter({ text: 'Discord Quest Bot', iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Botão de confirmação
      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('login_confirm')
          .setLabel('✅ Confirmar')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('login_cancel')
          .setLabel('❌ Cancelar')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.editReply({ 
        embeds: [successEmbed],
        components: [confirmRow]
      });
    } catch (error) {
      console.error('Erro no login:', error);

      // Registrar erro no histórico
      await HistoryDB.log(discordId, 'login', null, 'failed');

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro na Autenticação')
        .setDescription('O token fornecido é inválido ou expirado.')
        .addFields(
          { name: '⚠️ Erro', value: error.message, inline: false },
          { name: '💡 Dica', value: 'Verifique se seu token está correto e tente novamente.', inline: false }
        )
        .setFooter({ text: 'Discord Quest Bot' })
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
