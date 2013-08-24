
/* global describe, it */
/* jshint -W030 */
var chai = require('../'),
    expect = require('chai').expect;

describe('format()', function() {
    it('should work with invalid numbers', function() {
        expect(chai.format('This string contains #{-1}, #{0}, #{1}, #{3}, and #{1.5}', 'str1', 'str2'))
        .to.equal("This string contains #{-1}, #{0}, 'str1', #{3}, and #{1.5}");
    });
    it('should work for objects', function() {
        var obj = {
            str: 'a nice day',
            obj: {
                start: 1,
                end: 5
            },
            arr: [1, 2, 3]
        };
        expect(chai.format('Param #{1} is an object', obj))
        .to.equal("Param { str: 'a nice day',\n  obj: { start: 1, end: 5 },\n  arr: [ 1, 2, 3 ] } is an object");
    });
    it('should work for arrays', function() {
        var arr = ['nice guy', { isObj: true, value: 100 }, ['a', 'sub', 'array']];
        expect(chai.format('Param #{2} is an array', 0, arr))
        .to.equal("Param [ 'nice guy',\n  { isObj: true, value: 100 },\n  [ 'a', 'sub', 'array' ] ] is an array");
    });
    it('should work for strings', function() {
        var str = 'This is a test string containing \' and ".';
        expect(chai.format('Param #{3} is a string', 0, 1, str))
        .to.equal("Param 'This is a test string containing \\' and \".' is a string");
    });
    it('should work for undefined', function() {
        expect(chai.format('Param #{1} is undefined, param #{2} is not', undefined))
        .to.equal("Param undefined is undefined, param #{2} is not");
    });
});
