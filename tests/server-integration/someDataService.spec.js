// TODO: Implement server tests that use BardJS's real $http and $q
/* jshint -W117, -W030 */


/* Example code:


describe('Server: dataservice', function() {
    var dataservice;

    beforeEach(bard.asyncModule('app'));

    beforeEach(inject(function(_dataservice_) {
        dataservice = _dataservice_;
    }));

    describe('when call getCustomers', function() {

        it('should get 16 Customers', function(done) {
            dataservice.getCustomers()
                .then(function(data) {
                    expect(data).to.have.length(16);
                })
                .then(done, done);
        });

        it('should contain Black Widow', function(done) {
            dataservice.getCustomers()
                .then(function(data) {
                    var hasBlackWidow = data && data.some(function foundHer(customer) {
                        return customer.firstName.indexOf('Black') >= 0;
                    });
                    expect(hasBlackWidow).to.be.true;
                })
                .then(done, done);
        });
    });

    describe('when call getCustomer', function() {

        it('should get Black Widow', function(done) {
            dataservice.getCustomer('1017109')
                .then(function(customer) {
                    var hasBlackWidow = customer.firstName === 'Black';
                    expect(hasBlackWidow).to.be.true;
                })
                .then(done, done);
        });
    });
});
*/
