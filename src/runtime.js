/* eslint-disable camelcase, key-spacing */

const ffi = require('ffi');
const ref = require('ref');

const lib = new ffi.Library(null, {
  dlopen: ['pointer', ['string', 'int']]
});

const libobjc = new ffi.Library('libobjc', {
  // Selectors
  sel_getUid : ['pointer', ['string']],
  sel_getName: ['string', ['pointer']],

  // Classes
  objc_getClass          : ['pointer', ['string']],
  object_getClass        : ['pointer', ['pointer']],
  class_getName          : ['string', ['pointer']],
  class_getClassMethod   : ['pointer', ['pointer', 'pointer']],
  class_getInstanceMethod: ['pointer', ['pointer', 'pointer']],

  // Methods
  method_copyReturnType      : ['string', ['pointer']],
  method_copyArgumentType    : ['string', ['pointer', 'int']],
  method_getNumberOfArguments: ['int', ['pointer']]
});

libobjc.objc_msgSend = ffi.DynamicLibrary().get('objc_msgSend'); // eslint-disable-line new-cap

const importFramework = name => {
  const handle = lib.dlopen(`/System/Library/Frameworks/${name}.framework/${name}`, 1); // 1: RTLD_LAZY
  return !handle.isNull();
};

importFramework('Foundation');

const getSymbol = name => new ffi.DynamicLibrary().get(name);

// NSString* constants require special handling
// We have to adjust the symbol's type, in order to dereference it
const getSymbolAsId = name => {
  try {
    const symbol = getSymbol(name);
    symbol.type = ref.refType(ref.refType(ref.types.void));
    return symbol.deref();
  } catch (err) {
    return null;
  }
};

const msgSend = (returnType, argumentTypes) => {
  return ffi.ForeignFunction(libobjc.objc_msgSend, returnType, argumentTypes); // eslint-disable-line new-cap
};

const classExists = classname => {
  return !libobjc.objc_getClass(classname).isNull();
};

module.exports = libobjc;
module.exports.msgSend = msgSend;
module.exports.import = importFramework;
module.exports.classExists = classExists;
module.exports.getSymbol = getSymbol;
module.exports.getSymbolAsId = getSymbolAsId;
