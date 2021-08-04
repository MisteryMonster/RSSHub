const got = require('@/utils/got');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
module.exports = async (ctx) => {
    const url = `http://www.zhuhai.gov.cn/xw/ztjj/nqhmzczt/yqfkzt/`;
    const response = await got({
        method: 'get',
        url: url,
    });

    const data = response.data;
    const $ = cheerio.load(data);
    const list = $('ul.list li').get().slice(1, 10);
    const articledata = await Promise.all(
        list.map(async (item) => {
            const url = $(item).find('a').attr('href');
            const cache = await ctx.cache.get(url);
            if (cache) {
                return Promise.resolve(JSON.parse(cache));
            }
            const response2 = await got({
                method: 'get',
                url,
            });
            const articleHtml = response2.data;
            const $2 = cheerio.load(articleHtml);
            $2('div.bshare-custom').remove();
            $2('.jiathis_style_24x24').remove();
            const content = $2('div.main').html();
            const single = {
                content: content,
            };
            ctx.cache.set(url, JSON.stringify(single));
            return Promise.resolve(single);
        })
    );
    ctx.state.data = {
        title: '珠海疫情防控专题',
        link: url,
        item: list.map((item, index) => {
            item = $(item);
            const title = `${item.find('a').attr('title')}`;
            const ItemURL = `${item.find('a').attr('href')}`;
            const date = `${item
                .find('span')
                .text()
                .replace(/(\[|\])/g, '')}`;
            const pubdate = dayjs(date, { locale: 'zh-cn' });
            return {
                title: title,
                link: ItemURL,
                description: `${articledata[index].content}`,
                pubDate: pubdate,
            };
        }),
    };
};
