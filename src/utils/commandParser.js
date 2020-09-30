const PREFIX = process.env.PREFIX

const commandParser = (content, returnType = 'Object') => {
    const firstLine = content.split('\n')[0]
    var args = firstLine.slice(1, firstLine.length).split(" ")
    const commandInput = content.slice(PREFIX.length + firstLine.length).trim()

    args.forEach((arg) => {
        if(arg === '') args.splice(args.indexOf(arg), 1)
    })

    if (returnType === 'list' || returnType === 'List'){
        return [ PREFIX, args, commandInput ]
    }
    
    else return {
        prefix: PREFIX,
        commands: args,
        code: commandInput
    }
}

module.exports = commandParser