// "Build" ladders: a word grows into a full sentence, one step at a time.
// Uses only vocabulary from the Japanese 1-3 lists and grammar the class has covered.
// k: the vocab word the ladder is built around (its reading or kana spelling, as in data.js)
// s: steps, each [Japanese, reading, English, optional text for the voice when the kana would be misread]
window.KIDA_BUILD = [
  // ---- Japanese 3, unit 1-1 ----
  { k: 'たのしい', s: [
    ['たのしい', 'たのしい', 'fun'],
    ['とてもたのしい', 'とてもたのしい', 'really fun'],
    ['夏休みはとてもたのしかったです。', 'なつやすみはとてもたのしかったです。', 'Summer vacation was really fun.'],
  ] },
  { k: 'いそがしい', s: [
    ['いそがしい', 'いそがしい', 'busy'],
    ['今週はいそがしいです。', 'こんしゅうはいそがしいです。', 'I’m busy this week.'],
    ['今週はいそがしいので、ひまがありません。', 'こんしゅうはいそがしいので、ひまがありません。', 'I’m busy this week, so I have no free time.'],
  ] },
  { k: 'ほしい', s: [
    ['ほしい', 'ほしい', 'want (a thing)'],
    ['あたらしい車がほしい', 'あたらしいくるまがほしい', 'want a new car'],
    ['来年、あたらしい車がほしいです。', 'らいねん、あたらしいくるまがほしいです。', 'Next year, I want a new car.'],
  ] },
  { k: '〜たい・したい', s: [
    ['行きたい', 'いきたい', 'want to go'],
    ['日本に行きたい', 'にほんにいきたい', 'want to go to Japan'],
    ['来年、日本に行きたいです。', 'らいねん、にほんにいきたいです。', 'I want to go to Japan next year.'],
    ['来年、家族と日本に行きたいです。', 'らいねん、かぞくとにほんにいきたいです。', 'I want to go to Japan with my family next year.'],
  ] },
  { k: '行ってみたい', s: [
    ['行ってみたい', 'いってみたい', 'want to try going'],
    ['ゆうえんちに行ってみたい', 'ゆうえんちにいってみたい', 'want to try going to an amusement park'],
    ['夏休みに、ゆうえんちに行ってみたいです。', 'なつやすみに、ゆうえんちにいってみたいです。', 'I want to try going to an amusement park over summer vacation.'],
  ] },
  { k: 'がっこう', s: [
    ['学校', 'がっこう', 'school'],
    ['学校に行く', 'がっこうにいく', 'go to school'],
    ['毎日、学校に行きます。', 'まいにち、がっこうにいきます。', 'I go to school every day.'],
  ] },
  { k: 'きょねん', s: [
    ['去年', 'きょねん', 'last year'],
    ['去年の夏', 'きょねんのなつ', 'last summer'],
    ['去年の夏、日本に行きました。', 'きょねんのなつ、にほんにいきました。', 'Last summer, I went to Japan.'],
  ] },

  // ---- Japanese 3, unit 1-2 ----
  { k: 'ひさしぶり', s: [
    ['ひさしぶり', 'ひさしぶり', 'long time no see'],
    ['ひさしぶりですね。', 'ひさしぶりですね。', 'It’s been a long time.'],
    ['ひさしぶりですね。元気ですか。', 'ひさしぶりですね。げんきですか。', 'Long time no see. How are you?'],
  ] },
  { k: 'たのしみにしています', s: [
    ['たのしみ', 'たのしみ', 'something to look forward to'],
    ['たのしみにしています', 'たのしみにしています', 'I’m looking forward to it'],
    ['夏休みをたのしみにしています。', 'なつやすみをたのしみにしています。', 'I’m looking forward to summer vacation.'],
  ] },
  { k: 'かきごおり', s: [
    ['かきごおり', 'かきごおり', 'shaved ice'],
    ['かきごおりを食べる', 'かきごおりをたべる', 'eat shaved ice'],
    ['夏まつりで、かきごおりを食べたいです。', 'なつまつりで、かきごおりをたべたいです。', 'I want to eat shaved ice at the summer festival.'],
  ] },
  { k: '〜たこと', s: [
    ['食べたことがある', 'たべたことがある', 'have eaten (before)'],
    ['うなぎを食べたことがある', 'うなぎをたべたことがある', 'have eaten eel before'],
    ['うなぎを食べたことがありますか。', 'うなぎをたべたことがありますか。', 'Have you ever eaten eel?'],
    ['日本でうなぎを食べたことがありますか。', 'にほんでうなぎをたべたことがありますか。', 'Have you ever eaten eel in Japan?'],
  ] },
  { k: 'お化けやしき', s: [
    ['お化けやしき', 'おばけやしき', 'haunted house'],
    ['お化けやしきに入る', 'おばけやしきにはいる', 'go into a haunted house'],
    ['お化けやしきに入ったことがありますか。', 'おばけやしきにはいったことがありますか。', 'Have you ever gone into a haunted house?'],
  ] },
  { k: 'はなび', s: [
    ['花火', 'はなび', 'fireworks'],
    ['花火を見る', 'はなびをみる', 'watch fireworks'],
    ['夏まつりで花火を見ました。', 'なつまつりではなびをみました。', 'I watched fireworks at the summer festival.'],
    ['去年の夏まつりで、きれいな花火を見ました。', 'きょねんのなつまつりで、きれいなはなびをみました。', 'At last year’s summer festival, I watched beautiful fireworks.'],
  ] },
  { k: 'あう', s: [
    ['会う', 'あう', 'to meet'],
    ['ともだちに会う', 'ともだちにあう', 'meet a friend'],
    ['日曜日に、ともだちに会います。', 'にちようびに、ともだちにあいます。', 'I’ll meet a friend on Sunday.'],
    ['日曜日に、駅でともだちに会います。', 'にちようびに、えきでともだちにあいます。', 'I’ll meet a friend at the station on Sunday.'],
  ] },
  { k: 'きいた', s: [
    ['聞きました', 'ききました', 'heard'],
    ['先生から聞きました', 'せんせいからききました', 'heard it from the teacher'],
    ['テストは金曜日だと、先生から聞きました。', 'テストはきんようびだと、せんせいからききました。', 'I heard from the teacher that the test is on Friday.'],
  ] },

  // ---- Japanese 3, unit 1-3 ----
  { k: 'のる', s: [
    ['のる', 'のる', 'to ride'],
    ['しんかんせんにのる', 'しんかんせんにのる', 'ride the bullet train'],
    ['しんかんせんにのったことがあります。', 'しんかんせんにのったことがあります。', 'I’ve ridden the bullet train before.'],
  ] },
  { k: 'えき', s: [
    ['駅', 'えき', 'station'],
    ['駅まで歩く', 'えきまであるく', 'walk to the station'],
    ['駅まで歩いて十分です。', 'えきまであるいてじゅっぷんです。', 'It’s a ten-minute walk to the station.'],
  ] },
  { k: 'どうやって', s: [
    ['どうやって', 'どうやって', 'how'],
    ['どうやって行きますか', 'どうやっていきますか', 'how do you get there?'],
    ['駅までどうやって行きますか。', 'えきまでどうやっていきますか。', 'How do you get to the station?'],
  ] },
  { k: 'なんかいも', s: [
    ['何回も', 'なんかいも', 'many times'],
    ['何回も見ました', 'なんかいもみました', 'watched it many times'],
    ['このアニメは何回も見ました。', 'このアニメはなんかいもみました。', 'I’ve watched this anime many times.'],
  ] },
  { k: 'こんど', s: [
    ['今度', 'こんど', 'next time'],
    ['今度、会いましょう', 'こんど、あいましょう', 'let’s meet next time'],
    ['今度、また会いましょう！', 'こんど、またあいましょう！', 'Let’s meet again next time!'],
  ] },

  // ---- Japanese 3, unit 1-4 ----
  { k: 'どのぐらい', s: [
    ['どのぐらい', 'どのぐらい', 'how long / how much'],
    ['どのぐらいかかりますか', 'どのぐらいかかりますか', 'how long does it take?'],
    ['学校までどのぐらいかかりますか。', 'がっこうまでどのぐらいかかりますか。', 'How long does it take to get to school?'],
  ] },
  { k: 'かかります', s: [
    ['かかる', 'かかる', 'to take (time)'],
    ['三十分かかる', 'さんじゅっぷんかかる', 'takes thirty minutes'],
    ['学校まで三十分かかります。', 'がっこうまでさんじゅっぷんかかります。', 'It takes thirty minutes to get to school.'],
    ['家から学校まで、バスで三十分かかります。', 'いえからがっこうまで、バスでさんじゅっぷんかかります。', 'From home to school takes thirty minutes by bus.'],
  ] },
  { k: 'ひこうき', s: [
    ['ひこうき', 'ひこうき', 'airplane'],
    ['ひこうきで行く', 'ひこうきでいく', 'go by plane'],
    ['日本までひこうきで行きます。', 'にほんまでひこうきでいきます。', 'I’ll go to Japan by plane.'],
  ] },
  { k: '〜と思う', s: [
    ['思います', 'おもいます', 'I think'],
    ['たのしいと思います', 'たのしいとおもいます', 'I think it’s fun'],
    ['日本語はたのしいと思います。', 'にほんごはたのしいとおもいます。', 'I think Japanese is fun.'],
  ] },
  { k: 'あぶない', s: [
    ['あぶない', 'あぶない', 'dangerous'],
    ['夜はあぶない', 'よるはあぶない', 'night is dangerous'],
    ['夜、一人で歩くのはあぶないと思います。', 'よる、ひとりであるくのはあぶないとおもいます。', 'I think walking alone at night is dangerous.'],
  ] },
  { k: 'べんり', s: [
    ['べんり', 'べんり', 'convenient'],
    ['とてもべんり', 'とてもべんり', 'very convenient'],
    ['しんかんせんはとてもべんりです。', 'しんかんせんはとてもべんりです。', 'The bullet train is very convenient.'],
  ] },
  { k: 'とおい', s: [
    ['とおい', 'とおい', 'far'],
    ['家からとおい', 'いえからとおい', 'far from home'],
    ['学校は家からとおいです。', 'がっこうはいえからとおいです。', 'School is far from my house.'],
  ] },
  { k: 'あんぜん', s: [
    ['安ぜん', 'あんぜん', 'safe'],
    ['とても安ぜん', 'とてもあんぜん', 'very safe'],
    ['日本の電車はとても安ぜんです。', 'にほんのでんしゃはとてもあんぜんです。', 'Trains in Japan are very safe.'],
  ] },

  // ---- Japanese 3, unit 2-1 ----
  { k: 'かぞく', s: [
    ['家族', 'かぞく', 'family'],
    ['家族とこうえんに行く', 'かぞくとこうえんにいく', 'go to the park with my family'],
    ['週末、家族とこうえんに行きました。', 'しゅうまつ、かぞくとこうえんにいきました。', 'I went to the park with my family on the weekend.'],
  ] },
  { k: 'まいにち', s: [
    ['毎日', 'まいにち', 'every day'],
    ['毎日べんきょうする', 'まいにちべんきょうする', 'study every day'],
    ['毎日、日本語をべんきょうしています。', 'まいにち、にほんごをべんきょうしています。', 'I study Japanese every day.'],
  ] },
  { k: 'しゅうまつ', s: [
    ['週末', 'しゅうまつ', 'weekend'],
    ['週末に何をしますか', 'しゅうまつになにをしますか', 'what will you do on the weekend?'],
    ['週末に何をしたいですか。', 'しゅうまつになにをしたいですか。', 'What do you want to do on the weekend?'],
  ] },
  { k: 'いたい', s: [
    ['痛い', 'いたい', 'painful / it hurts'],
    ['のどが痛い', 'のどがいたい', 'my throat hurts'],
    ['きのうから、のどが痛いです。', 'きのうから、のどがいたいです。', 'My throat has hurt since yesterday.'],
  ] },

  // ---- Japanese 3, unit 2-2 ----
  { k: 'びょういん', s: [
    ['病院', 'びょういん', 'hospital'],
    ['病院に行く', 'びょういんにいく', 'go to the hospital'],
    ['病院に行った方がいいですよ。', 'びょういんにいったほうがいいですよ。', 'You should go to the hospital.'],
    ['ねつがあるので、病院に行った方がいいですよ。', 'ねつがあるので、びょういんにいったほうがいいですよ。', 'You have a fever, so you should go to the hospital.'],
  ] },
  { k: 'くすり（のみます）', s: [
    ['くすり', 'くすり', 'medicine'],
    ['くすりを飲む', 'くすりをのむ', 'take medicine'],
    ['くすりを飲んでください。', 'くすりをのんでください。', 'Please take your medicine.'],
    ['ねる前に、このくすりを飲んでください。', 'ねるまえに、このくすりをのんでください。', 'Please take this medicine before you go to sleep.'],
  ] },
  { k: '〜たほうがいい', s: [
    ['ねた方がいい', 'ねたほうがいい', 'better to sleep'],
    ['早くねた方がいい', 'はやくねたほうがいい', 'better to go to bed early'],
    ['今日は早くねた方がいいですよ。', 'きょうははやくねたほうがいいですよ。', 'You should go to bed early tonight.'],
  ] },
  { k: '〜ないほうがいい', s: [
    ['食べない方がいい', 'たべないほうがいい', 'better not to eat'],
    ['おかしを食べない方がいい', 'おかしをたべないほうがいい', 'better not to eat snacks'],
    ['ねる前に、おかしを食べない方がいいです。', 'ねるまえに、おかしをたべないほうがいいです。', 'It’s better not to eat snacks before bed.'],
  ] },
  { k: '〜ので', s: [
    ['ねむいので', 'ねむいので', 'because I’m sleepy'],
    ['ねむいので、ねます', 'ねむいので、ねます', 'I’m sleepy, so I’ll go to bed'],
    ['ねむいので、もうねます。', 'ねむいので、もうねます。', 'I’m sleepy, so I’m going to bed now.'],
  ] },
  { k: '〜なければ', s: [
    ['行かなければ', 'いかなければ', 'have to go'],
    ['学校に行かなければいけません', 'がっこうにいかなければいけません', 'I have to go to school'],
    ['明日は学校に行かなければいけません。', 'あしたはがっこうにいかなければいけません。', 'I have to go to school tomorrow.'],
  ] },
  { k: 'つかれます', s: [
    ['つかれる', 'つかれる', 'to get tired'],
    ['とてもつかれました', 'とてもつかれました', 'I got really tired'],
    ['ぶかつどうのあと、とてもつかれました。', 'ぶかつどうのあと、とてもつかれました。', 'I was really tired after club activities.'],
  ] },

  // ---- Japanese 3, unit 2-3 ----
  { k: '〜なくてもいい', s: [
    ['行かなくてもいい', 'いかなくてもいい', 'don’t have to go'],
    ['学校に行かなくてもいい', 'がっこうにいかなくてもいい', 'don’t have to go to school'],
    ['明日は休みなので、学校に行かなくてもいいです。', 'あしたはやすみなので、がっこうにいかなくてもいいです。', 'Tomorrow is a day off, so I don’t have to go to school.'],
  ] },
  { k: '〜なる、なります', s: [
    ['なる', 'なる', 'to become'],
    ['元気になる', 'げんきになる', 'get better'],
    ['早く元気になってください。', 'はやくげんきになってください。', 'Please get well soon.'],
  ] },
  { k: 'だいじょうぶ', s: [
    ['大じょうぶ', 'だいじょうぶ', 'OK'],
    ['大じょうぶですか', 'だいじょうぶですか', 'are you OK?'],
    ['元気がないですね。大じょうぶですか。', 'げんきがないですね。だいじょうぶですか。', 'You don’t seem well. Are you OK?'],
  ] },
  { k: 'かぜ（ひきます）', s: [
    ['かぜをひく', 'かぜをひく', 'catch a cold'],
    ['かぜをひきました', 'かぜをひきました', 'I caught a cold'],
    ['先週、かぜをひきました。', 'せんしゅう、かぜをひきました。', 'I caught a cold last week.'],
    ['先週、かぜをひいたので、学校を休みました。', 'せんしゅう、かぜをひいたので、がっこうをやすみました。', 'I caught a cold last week, so I missed school.'],
  ] },
  { k: 'ねつ（あります）', s: [
    ['ねつ', 'ねつ', 'fever'],
    ['ねつがあります', 'ねつがあります', 'I have a fever'],
    ['今日はねつがあるので、ねています。', 'きょうはねつがあるので、ねています。', 'I have a fever today, so I’m resting in bed.'],
  ] },
  { k: 'みがきます', s: [
    ['みがく', 'みがく', 'to brush'],
    ['はをみがく', 'はをみがく', 'brush my teeth', '歯をみがく'],
    ['ねる前に、はをみがきます。', 'ねるまえに、はをみがきます。', 'I brush my teeth before bed.', 'ねる前に、歯をみがきます。'],
  ] },
  { k: 'しょうらい', s: [
    ['しょうらい', 'しょうらい', 'the future'],
    ['しょうらい、医者になりたい', 'しょうらい、いしゃになりたい', 'want to be a doctor in the future'],
    ['しょうらい、医者になりたいです。', 'しょうらい、いしゃになりたいです。', 'In the future, I want to be a doctor.'],
  ] },
  { k: 'たぶん', s: [
    ['多分', 'たぶん', 'probably'],
    ['多分、雨です', 'たぶん、あめです', 'probably rain'],
    ['明日は多分、雨だと思います。', 'あしたはたぶん、あめだとおもいます。', 'I think it will probably rain tomorrow.'],
  ] },
  { k: 'あとで', s: [
    ['後で', 'あとで', 'later'],
    ['後でします', 'あとでします', 'I’ll do it later'],
    ['べんきょうは後でします。', 'べんきょうはあとでします。', 'I’ll study later.'],
  ] },

  // ---- Japanese 3, unit 2-4 ----
  { k: 'つくります', s: [
    ['作る', 'つくる', 'to make'],
    ['晩ごはんを作る', 'ばんごはんをつくる', 'make dinner'],
    ['今夜、晩ごはんを作ります。', 'こんや、ばんごはんをつくります。', 'I’ll make dinner tonight.'],
    ['今夜、家族に晩ごはんを作ります。', 'こんや、かぞくにばんごはんをつくります。', 'I’ll make dinner for my family tonight.'],
  ] },
  { k: 'つくりかた', s: [
    ['作り方', 'つくりかた', 'how to make'],
    ['おかしの作り方', 'おかしのつくりかた', 'how to make sweets'],
    ['おかしの作り方をおしえてください。', 'おかしのつくりかたをおしえてください。', 'Please teach me how to make sweets.'],
  ] },
  { k: 'つかいます', s: [
    ['使う', 'つかう', 'to use'],
    ['パソコンを使う', 'パソコンをつかう', 'use the computer'],
    ['パソコンを使ってもいいですか。', 'パソコンをつかってもいいですか。', 'May I use the computer?'],
  ] },
  { k: 'はやおき（します）', s: [
    ['はや起き', 'はやおき', 'waking up early'],
    ['毎日はや起きする', 'まいにちはやおきする', 'wake up early every day'],
    ['毎日はや起きしています。', 'まいにちはやおきしています。', 'I wake up early every day.'],
  ] },
  { k: 'ねぼう（します）', s: [
    ['寝ぼう', 'ねぼう', 'oversleeping'],
    ['寝ぼうしました', 'ねぼうしました', 'I overslept'],
    ['今朝、寝ぼうしました。', 'けさ、ねぼうしました。', 'I overslept this morning.'],
    ['今朝、寝ぼうしたので、朝ごはんを食べませんでした。', 'けさ、ねぼうしたので、あさごはんをたべませんでした。', 'I overslept this morning, so I didn’t eat breakfast.'],
  ] },
  { k: 'ひるね', s: [
    ['昼寝', 'ひるね', 'nap'],
    ['昼寝をする', 'ひるねをする', 'take a nap'],
    ['日曜日に昼寝をしました。', 'にちようびにひるねをしました。', 'I took a nap on Sunday.'],
  ] },
  { k: '〜という', s: [
    ['何と言いますか', 'なんといいますか', 'what do you call it?'],
    ['日本語で何と言いますか', 'にほんごでなんといいますか', 'what is it called in Japanese?'],
    ['これは日本語で何と言いますか。', 'これはにほんごでなんといいますか。', 'What is this called in Japanese?'],
  ] },

  // ---- Japanese 3, unit 2-5 ----
  { k: '〜すぎます', s: [
    ['食べすぎ', 'たべすぎ', 'eating too much'],
    ['食べすぎました', 'たべすぎました', 'I ate too much'],
    ['ケーキを食べすぎました。', 'ケーキをたべすぎました。', 'I ate too much cake.'],
  ] },
  { k: '〜にききます', s: [
    ['先生に聞く', 'せんせいにきく', 'ask the teacher'],
    ['先生に聞きます', 'せんせいにききます', 'I’ll ask the teacher'],
    ['わからない時は、先生に聞きます。', 'わからないときは、せんせいにききます。', 'When I don’t understand, I ask the teacher.'],
  ] },
  { k: 'きもち（が）いい', s: [
    ['気もちいい', 'きもちいい', 'feels good'],
    ['とても気もちいい', 'とてもきもちいい', 'feels really good'],
    ['森林浴はとても気もちいいです。', 'しんりんよくはとてもきもちいいです。', 'Forest bathing feels really good.'],
  ] },
  { k: 'におい', s: [
    ['におい', 'におい', 'smell'],
    ['いいにおい', 'いいにおい', 'a nice smell'],
    ['このパンはいいにおいがします。', 'このパンはいいにおいがします。', 'This bread smells good.'],
  ] },
  { k: 'からだにいい', s: [
    ['体にいい', 'からだにいい', 'good for your body'],
    ['やさいは体にいい', 'やさいはからだにいい', 'vegetables are good for you'],
    ['やさいは体にいいので、たくさん食べた方がいいです。', 'やさいはからだにいいので、たくさんたべたほうがいいです。', 'Vegetables are good for you, so you should eat a lot of them.'],
  ] },
  { k: 'どうぶつ', s: [
    ['動物', 'どうぶつ', 'animal'],
    ['動物が好き', 'どうぶつがすき', 'like animals'],
    ['私は動物が大好きです。', 'わたしはどうぶつがだいすきです。', 'I love animals.'],
  ] },
  { k: 'うんどう', s: [
    ['運動', 'うんどう', 'exercise'],
    ['運動する', 'うんどうする', 'to exercise'],
    ['週末に、こうえんで運動します。', 'しゅうまつに、こうえんでうんどうします。', 'I exercise at the park on weekends.'],
  ] },
  { k: 'はやねはやおき', s: [
    ['早寝早起き', 'はやねはやおき', 'early to bed, early to rise'],
    ['早寝早起きは体にいい', 'はやねはやおきはからだにいい', 'early to bed, early to rise is good for you'],
    ['早寝早起きは体にいいと思います。', 'はやねはやおきはからだにいいとおもいます。', 'I think going to bed early and getting up early is good for you.'],
  ] },
  { k: 'かいもの', s: [
    ['買い物', 'かいもの', 'shopping'],
    ['買い物に行く', 'かいものにいく', 'go shopping'],
    ['週末、デパートに買い物に行きます。', 'しゅうまつ、デパートにかいものにいきます。', 'I’ll go shopping at the department store this weekend.'],
  ] },
  { k: 'のみもの', s: [
    ['飲み物', 'のみもの', 'drink'],
    ['つめたい飲み物', 'つめたいのみもの', 'a cold drink'],
    ['つめたい飲み物がほしいです。', 'つめたいのみものがほしいです。', 'I want a cold drink.'],
  ] },

  // ---- Core verbs from Japanese 1 and 2 ----
  { k: 'たべます', s: [
    ['食べる', 'たべる', 'to eat'],
    ['朝ごはんを食べる', 'あさごはんをたべる', 'eat breakfast'],
    ['毎朝、朝ごはんを食べます。', 'まいあさ、あさごはんをたべます。', 'I eat breakfast every morning.'],
  ] },
  { k: 'のむ', s: [
    ['飲む', 'のむ', 'to drink'],
    ['水を飲む', 'みずをのむ', 'drink water'],
    ['水をたくさん飲んでください。', 'みずをたくさんのんでください。', 'Please drink a lot of water.'],
  ] },
  { k: 'いきます', s: [
    ['行く', 'いく', 'to go'],
    ['としょかんに行く', 'としょかんにいく', 'go to the library'],
    ['明日、としょかんに行きましょう。', 'あした、としょかんにいきましょう。', 'Let’s go to the library tomorrow.'],
  ] },
  { k: 'みます', s: [
    ['見る', 'みる', 'to watch'],
    ['えいがを見る', 'えいがをみる', 'watch a movie'],
    ['週末、ともだちとえいがを見ました。', 'しゅうまつ、ともだちとえいがをみました。', 'I watched a movie with friends over the weekend.'],
  ] },
  { k: 'よみます', s: [
    ['読む', 'よむ', 'to read'],
    ['まんがを読む', 'まんがをよむ', 'read manga'],
    ['毎晩、まんがを読んでいます。', 'まいばん、まんがをよんでいます。', 'I read manga every night.'],
  ] },
  { k: 'かきます', s: [
    ['書く', 'かく', 'to write'],
    ['かん字を書く', 'かんじをかく', 'write kanji'],
    ['かん字を書くのはむずかしいです。', 'かんじをかくのはむずかしいです。', 'Writing kanji is hard.'],
  ] },
  { k: 'かいます', s: [
    ['買う', 'かう', 'to buy'],
    ['くつを買う', 'くつをかう', 'buy shoes'],
    ['あたらしいくつを買いたいです。', 'あたらしいくつをかいたいです。', 'I want to buy new shoes.'],
  ] },
  { k: 'まちます', s: [
    ['待つ', 'まつ', 'to wait'],
    ['ちょっと待つ', 'ちょっとまつ', 'wait a moment'],
    ['ちょっと待ってください。', 'ちょっとまってください。', 'Please wait a moment.'],
  ] },
  { k: 'あるきます', s: [
    ['歩く', 'あるく', 'to walk'],
    ['学校まで歩く', 'がっこうまであるく', 'walk to school'],
    ['毎日、学校まで歩いて行きます。', 'まいにち、がっこうまであるいていきます。', 'I walk to school every day.'],
  ] },
  { k: 'ききます', s: [
    ['聞く', 'きく', 'to listen'],
    ['おんがくを聞く', 'おんがくをきく', 'listen to music'],
    ['おんがくを聞きながら、べんきょうします。', 'おんがくをききながら、べんきょうします。', 'I study while listening to music.'],
  ] },
  { k: 'はなします', s: [
    ['話す', 'はなす', 'to speak'],
    ['日本語で話す', 'にほんごではなす', 'speak in Japanese'],
    ['日本語で話してみましょう。', 'にほんごではなしてみましょう。', 'Let’s try speaking in Japanese.'],
  ] },
  { k: 'はいります', s: [
    ['入る', 'はいる', 'to enter / get in'],
    ['おふろに入る', 'おふろにはいる', 'take a bath'],
    ['ねる前に、おふろに入ります。', 'ねるまえに、おふろにはいります。', 'I take a bath before bed.'],
  ] },
  { k: 'たちます', s: [
    ['立つ', 'たつ', 'to stand'],
    ['立ってください', 'たってください', 'please stand up'],
    ['みなさん、立ってください。', 'みなさん、たってください。', 'Everyone, please stand up.'],
  ] },
];
