let visibleTweetCounter = 0;

const onInteraction = (entries, observer) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            visibleTweetCounter++;
            console.log(`counted a tweet! total: ${visibleTweetCounter}`);
            entry.target.setAttribute('data-seen', 'true');
            observer.unobserve(entry.target);
        }
    })
}

const observerOptions = {
    root: null, // for view port
    threshold: 0 /* Triggers when tweet just touches
    the boundary of view port */
};

const tweetObserver = new IntersectionObserver(onInteraction, observerOptions)

const tweets = document.querySelectorAll('article[data-testid="tweet"]');

tweets.forEach((tweet) => {
    tweetObserver.observe(tweet)
});

setInterval(() => {
    const newTweets = document.querySelectorAll('article[data-testid="tweet"');

    newTweets.forEach((tweet) => {
        if (!tweet.hasAttribute('data-seen')){
            tweetObserver.observe(tweet);
        }
    });
}, 2000);