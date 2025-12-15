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

// use mutationObserver to look for new tweets
// being added to the feed container
// and add them to the tweet observer

const feedContainer = document.querySelector('div[aria-label="Home timeline"]');

const onMutation = (mutationsList, observer) => {
    for (const mutation of mutationsList) {
        if (mutation.type == 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches('article[data-testid="tweet"]')) {
                        tweetObserver.observe(node);
                    }

                    const newTweets = node.querySelectorAll('article[data-testid="tweet"]');
                    newTweets.forEach(tweet => {
                        tweetObserver.observe(tweet);
                    });
                }
            });
        }
    }
};

const mutationObserverOptions = {
    childList: true,
    subtree: true
};

const mutationObserver = new MutationObserver(onMutation)

if (feedContainer){
    mutationObserver.observe(feedContainer, mutationObserverOptions);
    console.log("Mutationobserver is now watching the feed container");
} else {
    console.log("Could not find mutation observer");
};
