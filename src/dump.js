(function main() {
  'use strict'

  const toString = Object.prototype.toString

  let baseIndent = ''
  let visitedObjects = null
  let objectCount = 0

  function dumpValue(value, indent, prefix) {
    const type = typeof value

    if (type === 'string') {
      return indent + prefix + JSON.stringify(value)
    }

    if (!value) {
      return indent + prefix + String(value)
    }

    let string

    if (type === 'object') {
      if (Array.isArray(value)) {
        string = dumpArray(value, indent, prefix)
      } else if (getObjectType(value) === 'RegExp') {
        string = dumpRegExp(value, indent, prefix)
      } else {
        string = dumpObject(value, indent, prefix)
      }
    } else if (type === 'function') {
      string = dumpFunction(value, indent, prefix)
    } else {
      string = indent + prefix + String(value)
    }

    return string
  }

  function dumpArray(array, indent, prefix, depth) {
    const entry = visitedObjects.find((entry) => entry.object === array)
    const id = (entry ? entry.id : ++objectCount)

    let string = indent + prefix + '/* Array (' + id + ') */ ['

    if (entry) {
      return string + '/* visited */]'
    }

    visitedObjects.push({
      object: array,
      id: id,
    })

    if (array.length > 0) {
      const newIndent = indent + baseIndent
      const valueDumps = array.map((value) => dumpValue(value, newIndent, ''))

      string += '\n' + valueDumps.join(',\n') + '\n' + indent + ']'
    } else {
      string += ']'
    }

    return string
  }

  function dumpRegExp(re, indent, prefix) {
    return indent + prefix + String(re)
  }

  function dumpObject(object, indent, prefix) {
    const entry = visitedObjects.find((entry) => entry.object === object)
    const id = (entry ? entry.id : ++objectCount)

    let string = indent + prefix + '/* ' + getObjectType(object) + ' (' + id + ') */ {'

    if (entry) {
      return string + '/* visited */}'
    }

    visitedObjects.push({
      object: object,
      id: id,
    })

    const names = Object.getOwnPropertyNames(object)

    if (names.length > 0) {
      const newIndent = indent + baseIndent

      const propertyDumps = names.sort().map((name) => {
        let prefix

        if (isValidName(name)) {
          prefix = name
        } else {
          prefix = JSON.stringify(name)
        }

        prefix += ': '

        let value

        try {
          value = object[name]
        } catch (error) {
          return newIndent + prefix + 'undefined /* inaccessible */'
        }

        return dumpValue(value, newIndent, prefix)
      })

      string += '\n' + propertyDumps.join(',\n') + '\n' + indent + '}'
    } else {
      string += '}'
    }

    return string
  }

  function dumpFunction(fn, indent, prefix) {
    let declaration = String(fn)
    let i = declaration.indexOf('{')
    let content

    if (i >= 0) {
      content = declaration.slice(i + 1, declaration.lastIndexOf('}'))
    } else {
      i = declaration.indexOf('=>')

      if (i >= 0) {
        i += 2
        content = declaration.slice(i)
      } else {
        content = '[native code]'
        declaration = 'function ' + getObjectType(fn) + '() {' + content + '}'
        i = declaration.indexOf('{')
      }
    }

    content = content.trim()

    let signature = normalizeSpace(declaration.slice(0, i)).trim()
    let name = ''
    let args = ''

    signature = signature.replace(/(\S*)\((.*)\)/, (_, matchedName, matchedArgs) => {
      name = fixFunctionName(matchedName)
      args = matchedArgs.trim()

      if (!args.length && fn.length > 0) {
        args = '/* ' + fn.length + ' */'
      }

      return (name + '(' + args + ')')
    })

    let body

    if (content.length > 0) {
      if (content === '[native code]') {
        body = '/* native */'
      } else {
        body = '/* ... */'
      }
    } else {
      body = ''
    }

    return indent + prefix + signature + ' {' + body + '}'
  }

  function getObjectType(object) {
    return toString.call(object).slice(8, -1)
  }

  function isValidName(name) {
    return (/^[a-z_$][\w$]*$/i).test(name)
  }

  function fixFunctionName(name) {
    const i = name.lastIndexOf('.')

    if (i >= 0) {
      name = name.slice(i + 1)
    }

    return (isValidName(name) ? name : '/* ' + name + ' */')
  }

  function normalizeSpace(string) {
    return string.replace(/\s\s+/g, ' ')
  }

  function dump(value, indent = '  ') {
    baseIndent = indent
    visitedObjects = []
    objectCount = 0

    const string = dumpValue(value, '', '')

    visitedObjects = null

    return string
  }

  function dumpOut(value, indent = '  ') {
    const dumpElement = document.getElementById('dump')

    if (dumpElement) {
      dumpElement.value = dump(value, indent)
    }
  }

  window.dump = dump
  window.dumpOut = dumpOut
})()
