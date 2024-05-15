const { run } = require("hardhat")
const { log: clog } = console

const verify = async (contractAddress, args) => {
    clog("Verifying Contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            clog("Already Verified!")
        } else {
            clog(e)
        }
    }
}

module.exports = { verify }
