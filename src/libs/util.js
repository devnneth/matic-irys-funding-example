const sleep = async (time) => {
    await new Promise((resolve) => setTimeout(() => resolve(true), time));
};

const pad = (v, len) => {
    return v.toString().padStart(len);
}

module.exports = {
    sleep,
    pad
};
