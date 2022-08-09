const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const { token } = require('./config.json');
const https = require('https');
const jsdom = require('jsdom');
const cron = require('node-cron');
const atcoderURL = 'https://atcoder.jp/contests/?lang=en';
const CHANNEL_ID = '946371427202908183';
const SERVER_ID = '946371427202908180';
let channel;
setSchedule(0);

function setSchedule(index) {
  return new Promise((resolve, reject) => {
    https.get(atcoderURL, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let scheduleList = [];
        const { window } = new jsdom.JSDOM(data);
        const document = window.document;
        const item = document.querySelectorAll('#contest-table-upcoming tbody > tr')[index];

        const contestScheduleTime = new Date(item.querySelector('time').textContent);
        contestScheduleTime.setMinutes(contestScheduleTime.getMinutes() - 30);
        const contestTitle = item.querySelectorAll('td')[1].querySelector('a').textContent;
        const contestShortTitle = item
          .querySelectorAll('td')[1]
          .querySelector('a')
          .href.split('/')[2]
          .toUpperCase();
        const contestScheduleTimeFormated = `0 ${contestScheduleTime.getMinutes()} ${contestScheduleTime.getHours()} ${contestScheduleTime.getDate()} ${
          contestScheduleTime.getMonth() + 1
        } *`;
        const schedule = {
          contestScheduleTime,
          contestTitle,
          contestShortTitle,
          contestScheduleTimeFormated,
        };
        let currentTask = cron.schedule(schedule.contestScheduleTimeFormated, async () => {
          currentTask.stop();
          channel.send(`@everyone ${schedule.contestTitle} is comming!`);
          const thread = await channel.threads.create({
            name: schedule.contestShortTitle,
            reason: `${schedule.contestTitle} is comming!`,
          });
          setSchedule(1);
          client.guilds.cache.get(SERVER_ID).members.cache.forEach(async (member) => {
            await thread.members.add(member.user.id);
          });
          channel.send(
            `:regional_indicator_a: https://atcoder.jp/contests/${schedule.contestShortTitle.toLowerCase()}/tasks/${
              schedule.contestShortTitle
            }_a`
          );
        });
        scheduleList.push(schedule);
      });
    });
  });
}

client.on('ready', () => {
  channel = client.channels.cache.get(CHANNEL_ID);
});

client.login(token);
