const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const user = ctx.params.user;
    const repo = ctx.params.repo;
    const discussions = ctx.params.discussions;
    const host = `https://github.com/${user}/${repo}/discussions/${discussions}`;
    const response = await got({
        method: 'get',
        url: host,
    });
    const data = response.data;
    const $ = cheerio.load(data);
    const list = $('.js-timeline-marker .js-timeline-item ');
    const discussionstitle = $('h1 span.js-issue-title').text();

    ctx.state.data = {
        allowEmpty: true,
        title: `${user}/${repo} GitHub discussions # ${discussions}`,
        link: host,
        item: list
            .map((index, item) => {
                item = $(item);

                const comment = `${item
                    .find('.width-full')
                    .html()
                    .replace(/<.?summary/g, '<div')
                    .replace(/<.?task-lists/g, '<div')
                    .replace(/<.?details-menu/g, '<div')
                    .replace(/<.?details/g, '<div')
                    .replace(/class=".*?"/g, '')}`;

                const ItemURL = `${item.find('div.discussions-timeline-scroll-target').attr('data-url').replace('/comments/', '#discussioncomment-')}`;
                const pubDate = `${item.find('relative-time').attr('datetime')}`;
                return {
                    title: `${discussionstitle}`,
                    description: `${comment}`,
                    link: `https://github.com` + `${ItemURL}`,
                    pubDate,
                };
            })
            .get(),
    };
};
