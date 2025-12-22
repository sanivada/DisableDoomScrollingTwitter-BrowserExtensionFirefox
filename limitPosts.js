let visibleTweetCounter = 0;
let LIMIT = 20; // default
let limitReached = false;
let limitPixel = 0;
let isScrollLocked = false;
const seenTweetIDs = new Set();

function getTweetID(tweetNode) {
    // tweetNode is either
    // 1. div with data-testid="cellInnerDiv"
    // or 2. article with data-testid="tweet"
    const tweetTimeNode = tweetNode.querySelector('time') 
    if (!tweetTimeNode) {
        return null;
    }

    const tweetLinkNode = tweetTimeNode.closest('a') 
    if (!tweetLinkNode) {
        return null;
    }
    const tweetURL = tweetLinkNode.href;
    // example url: https://x.com/yush_g/status/2001553031348019584

    const parts = tweetURL.split('/');
    const statusIndex = parts.indexOf('status');
    
    return parts[statusIndex + 1];
}

function getTweetWrapper(tweetArticle) {
    return tweetArticle.closest('div[data-testid="cellInnerDiv"]')
}

function cleanUpFeed(lastVisibleTweet) {

    let lastVisibleTweetWrapper = getTweetWrapper(lastVisibleTweet); 
    let sibling = lastVisibleTweetWrapper.nextElementSibling;
                    
    while (sibling) {
        sibling.style.setProperty('visibility', 'hidden', 'important');
        sibling.style.setProperty('opacity', '0', 'important');
        sibling = sibling.nextElementSibling;
    }
    
    const rect = lastVisibleTweetWrapper.getBoundingClientRect();
    const parentRect = lastVisibleTweetWrapper.parentElement.getBoundingClientRect();
    const relativePos = rect.bottom - parentRect.top;
    // add a stop sign
    const stopSign = document.createElement('div');
    stopSign.setAttribute('isExtensionStopSign', 'true');
    stopSign.innerText = `You have reached your limit of ${LIMIT} tweets`;
    stopSign.style.cssText = `
        font-weight: bold;
        text-align: center;
        margin: 20px;
        padding: 40px 20px;
        position: absolute;
        width: 100%;
        transform: translateY(${relativePos}px);
        min-height: 200px;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    lastVisibleTweetWrapper.after(stopSign);
    console.log('added the stop sign!')

    const stopSignRect = stopSign.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    limitPixel = stopSignRect.bottom + scrollTop;
    isScrollLocked = true;
};

// event listener to scroll
window.addEventListener('scroll', () => {
    if (isScrollLocked && window.scrollY + window.innerHeight > limitPixel) {
        window.scrollTo(0, limitPixel - window.innerHeight);
    }
});

function startApp(feedContainer) {

    // insersectionObserver callback
    const onInteraction = (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                visibleTweetCounter++;
                console.log(`counted a tweet! total: ${visibleTweetCounter}`);
                
                seenTweetIDs.add(getTweetID(entry.target));
                console.log('registered tweet id');

                if (visibleTweetCounter >= LIMIT) {
                    limitReached = true;
                    console.log('LIMIT REACHED.');
                    // clean up rest of tweets in the dom
                    observer.disconnect();
                    cleanUpFeed(entry.target);
                };

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

    const onMutation = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type == 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        
                        const currTweetID = getTweetID(node);

                        if (currTweetID && seenTweetIDs.has(currTweetID)) {
                            return ;
                        }

                        if (limitReached) {
                            if (!node.hasAttribute('isExtensionStopSign')) {
                                node.style.setProperty('visibility', 'hidden', 'important');
                                node.style.setProperty('opacity', '0', 'important');
                            };


                            
                        } else {
                            if (node.matches('article[data-testid="tweet"]')) {
                                tweetObserver.observe(node);
                            }

                            const newTweets = node.querySelectorAll('article[data-testid="tweet"]');
                            newTweets.forEach(tweet => {
                                tweetObserver.observe(tweet);
                            });
                        }
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

    mutationObserver.observe(feedContainer, mutationObserverOptions);

};

function waitFor(selector) {
    const feedContainer = document.querySelector(selector);
    if (feedContainer) {
        startApp(feedContainer);
        return;
    }

    const intervalToFindFeedContainer = setInterval(() => {
        const feedContainer = document.querySelector(selector);
        if (feedContainer) {
            startApp(feedContainer);
            clearInterval(intervalToFindFeedContainer);
        } else {
            console.log('feed container not found! trying again in 0.5s');
        }
    }, 500)
};

browser.storage.local.get("xPostLimitNum").then((result) => {
    LIMIT = result.xPostLimitNum || LIMIT;
    waitFor('div[aria-label="Home timeline"]');
});

// event listener for changes in storage
// only works if limit is changed before the limit is reached.
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.xPostLimitNum) {
        LIMIT = changes.xPostLimitNum.newValue;
    };
});
