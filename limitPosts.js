let visibleTweetCounter = 0;
let LIMIT = 20;
let limitReached = false;
const seenTweetIDs = new Set();

function getTweetID(tweetNode) {
    // tweetNode is either
    // 1. div with data-testid="cellInnerDiv"
    // or 2. article with data-testid="tweet"
    const tweetTimeNode = tweetNode.querySelector('time') 
    if (!tweetTimeNode) {
        return null;
    }
    const tweetURL = tweetTimeNode.closest('a').href;
    // example url: https://x.com/yush_g/status/2001553031348019584

    const parts = tweetURL.split('/');
    const statusIndex = parts.indexOf('status');
    
    return parts[statusIndex + 1];
}

function cleanUpFeed(lastVisibleTweet) {

    let lastVisibleTweetWrapper = lastVisibleTweet.closest('div[data-testid="cellInnerDiv"]'); 
    let sibling = lastVisibleTweetWrapper.nextElementSibling;

    while (sibling) {
        sibling.style.display = 'none';
        sibling = sibling.nextElementSibling;
    }
    console.log('cleaned the tweets after N tweets, after the limit is reached.')

    // add a stop sign
    const stopSign = document.createElement('div');
    // stopSign.id = 'extension-stop-sign';
    stopSign.setAttribute('isExtensionStopSign', 'true');
    stopSign.innerText = `You have reached your limit of ${LIMIT} tweets`;
    stopSign.style.fontWeight = "bold";
    stopSign.style.textAlign = "center";
    stopSign.style.padding = "20px";

    // const tweetContainer = document.querySelector('div[aria-label="Home timeline"]');
    // tweetContainer.append(stopSign);
    // lastVisibleTweet.parentNode.appendChild(stopSign);


    const timelineList = lastVisibleTweetWrapper.parentNode;
    // timelineList.appendChild(stopSign);
    console.log('added the stop sign!')

    /* parent of node with data-testid = "cellInnerDiv"
    has a min-height style set to a large value
    which dynamically increases
    */

    // timelineList.style.setProperty('min-height', '0px', 'important');
    // timelineList.style.setProperty('height', 'auto', 'important');
    // timelineList.style.setProperty('padding-bottom', '0px', 'important');

    // console.log('timeline feed container virtualisation height collapsed.')
};

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

                // entry.target.setAttribute('data-seen', 'true');
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

                        if (limitReached) {
                            // if (node.matches('article[data-testid="tweet"]') ||
                            //         node.querySelector('article[data-testid="tweet"]')) {
                            //             node.style.display = 'none';
                            //         };
                            const currTweetID = getTweetID(node);

                            if (currTweetID && seenTweetIDs.has(currTweetID)) {
                                // pass
                            } else if (!node.hasAttribute('isExtensionStopSign')) {
                                node.style.display = 'none';
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

waitFor('div[aria-label="Home timeline"]');
