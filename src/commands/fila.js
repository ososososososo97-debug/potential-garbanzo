const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { UserDB, QuestDB, HistoryDB } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fila')
    .setDescription('Veja todas as quests na sua fila'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const discordId = interaction.user.id;

    try {
      // Obter dados do usuário
      const user = await UserDB.get(discordId);
      if (!user) {
        const errorEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('❌ Não Autenticado')
          .setDescription('Você precisa usar `/login` primeiro para se autenticar.')
          .setFooter({ text: 'Use /login com seu token' });

        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Obter quests do usuário
      const quests = await QuestDB.getByUser(user.id);

      if (quests.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('📭 Sua Fila está Vazia')
          .setDescription('Você ainda não tem quests aceitas.')
          .addFields(
            { name: '💡 Dica', value: 'Use `/aceitar` para aceitar uma nova quest!', inline: false }
          )
          .setFooter({ text: 'Discord Quest Bot' })
          .setTimestamp();

        return await interaction.editReply({ embeds: [emptyEmbed] });
      }

      // Criar embed principal com estatísticas
      const stats = {
        total: quests.length,
        pending: quests.filter(q => q.status === 'pending').length,
        completed: quests.filter(q => q.status === 'completed').length,
        in_progress: quests.filter(q => q.status === 'in_progress').length
      };

      const mainEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📋 Sua Fila de Quests')
        .setDescription(`Você tem **${stats.total}** quest(s) aguardando`)
        .addFields(
          { name: '📊 Estatísticas', value: `Pendentes: **${stats.pending}** | Em Progresso: **${stats.in_progress}** | Completas: **${stats.completed}**`, inline: false },
          { name: '⏰ Última Atualização', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `Total de quests: ${stats.total}` })
        .setTimestamp();

      // Criar embeds para cada quest
      const questEmbeds = quests.slice(0, 10).map((quest, index) => {
        const statusEmoji = {
          'pending': '⏳',
          'completed': '✅',
          'in_progress': '🔄',
          'failed': '❌'
        }[quest.status] || '❓';

        const questEmbed = new EmbedBuilder()
          .setColor(quest.status === 'completed' ? '#00FF00' : quest.status === 'pending' ? '#FFFF00' : '#0099FF')
          .setTitle(`${statusEmoji} ${quest.questName}`)
          .addFields(
            { name: '🎯 ID', value: `\`${quest.questId}\``, inline: true },
            { name: '📊 Status', value: quest.status.toUpperCase(), inline: true },
            { name: '📅 Aceita em', value: `<t:${Math.floor(new Date(quest.createdAt).getTime() / 1000)}:f>`, inline: false }
          );

        if (quest.completedAt) {
          questEmbed.addFields(
            { name: '✅ Completada em', value: `<t:${Math.floor(new Date(quest.completedAt).getTime() / 1000)}:f>`, inline: false }
          );
        }

        return questEmbed;
      });

      // Criar botões de ação
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_fila')
          .setLabel('🔄 Atualizar')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('quest_stats')
          .setLabel('📊 Estatísticas')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('clear_completed')
          .setLabel('🗑️ Limpar Completas')
          .setStyle(ButtonStyle.Danger)
      );

      // Enviar resposta com todos os embeds
      const embeds = [mainEmbed, ...questEmbeds];
      await interaction.editReply({ 
        embeds: embeds.slice(0, 10), // Discord tem limite de 10 embeds
        components: [actionRow]
      });

      // Se houver mais de 10 quests, enviar mensagem adicional
      if (quests.length > 10) {
        const moreEmbed = new EmbedBuilder()
          .setColor('#FFFF00')
          .setTitle('📌 Limite de Exibição')
          .setDescription(`Você tem ${quests.length - 10} quest(s) adicional(is) que não foram exibidas.`)
          .setFooter({ text: 'Apenas as primeiras 10 quests são mostradas' });

        await interaction.followUp({ embeds: [moreEmbed], ephemeral: true });
      }
    } catch (error) {
      console.error('Erro ao listar fila:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Erro ao Listar Fila')
        .setDescription('Ocorreu um erro ao tentar listar suas quests.')
        .addFields(
          { name: '⚠️ Detalhes', value: error.message, inline: false }
        )
        .setFooter({ text: 'Discord Quest Bot' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
