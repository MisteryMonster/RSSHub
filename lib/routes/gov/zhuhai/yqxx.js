const got = require('@/utils/got');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
module.exports = async (ctx) => {
    const url = `http://wsjkj.zhuhai.gov.cn/zwgk/ztzl/yqfkzt/yqxx/`;
    const response = await got({
        method: 'get',
        url: url,
    });

    const data = response.data;
    const $ = cheerio.load(data);
    const list = $('div.wendangListC  ul li').get().slice(0, 10);
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
            $2('.fenx_con').remove();
            const content = $2('div.xxxq_text_cont').html();
            const single = {
                content: content,
            };
            ctx.cache.set(url, JSON.stringify(single));
            return Promise.resolve(single);
        })
    );
    ctx.state.data = {
        title: '珠海疫情信息',
        link: url,
        item: list.map((item, index) => {
            item = $(item);
            const title = `${item.find('a').attr('title')}`;
            const ItemURL = `${item.find('a').attr('href')}`;
            const date = `${item.find('strong').text().replace(/\s/g, '')}`;
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
