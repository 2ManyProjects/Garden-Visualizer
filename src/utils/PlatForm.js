

const isWindows = () => {
    if (navigator.userAgentData) {
        return navigator.userAgentData.platform === 'Windows';
    }
    return /Win/.test(navigator.userAgent);
};

const isLinux = () => {
    if (navigator.userAgentData) {
        return navigator.userAgentData.platform === 'Linux' || navigator.userAgentData.platform === 'iOS';
    }
    return /Linux/.test(navigator.userAgent) || /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isApple = () => {
    if (navigator.userAgentData) {
        return  navigator.userAgentData.platform === 'iOS'
        || navigator.userAgentData.platform === 'macOS';
    }
    return  /iPad|iPhone|iPod/.test(navigator.userAgent) || /Mac/.test(navigator.userAgent);
};


export {isWindows, isLinux, isApple}
