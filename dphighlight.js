var instance_skel = require('../../instance_skel');
var udp           = require('../../udp');
var debug;
var log;

function instance(system, id, config) {
	var self = this;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.init_udp = function() {
	var self = this;

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	if (self.config.host !== undefined) {
		self.udp = new udp(self.config.host, 7000);

		self.udp.on('status_change', function (status, message) {
			self.status(status, message);
		});
	}
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.status(self.STATUS_UNKNOWN);
	self.init_udp();
};

instance.prototype.updateConfig = function(config) {
	var self = this;
	self.config = config;

	if (self.udp !== undefined) {
		self.udp.destroy();
		delete self.udp;
	}

	self.status(self.STATUS_UNKNOWN);

	if (self.config.host !== undefined) {
		self.udp = new udp(self.config.host, 7000);

		self.udp.on('status_change', function (status, message) {
			self.status(status, message);
		});
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			regex: self.REGEX_IP
		}
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this;

	if (self.udp !== undefined) {
		self.udp.destroy();
	}
	debug("destroy", self.id);
};

instance.prototype.actions = function(system) {
	var self = this;

	self.system.emit('instance_actions', self.id, {
		'powerOn':        { label: 'Power On Projector' },
		'powerOff':       { label: 'Power Off Porjector' },
		'shutterOpen':    { label: 'Open Shutter' },
		'shutterClose':   { label: 'Close Shutter' },
		'freeze':         { label: 'Freeze Input' },
		'unfreeze':       { label: 'Unfreeze Input' },
		'bright+':        { label: 'Increase Brightnes' },
		'bright-':        { label: 'Decrease Brightnes' },
		'cont+':          { label: 'Increase Contrast' },
		'cont-':          { label: 'Decrease Contrast' },
		'sat+':           { label: 'Increase saturation' },
		'sat-':           { label: 'Decrease Saturation' }
	});
};

instance.prototype.action = function(action) {
	var self = this;
	var id = action.action;

	// dphl port 7000
	var dphl = {
		'powerOn':       '*power = 1 \r',
		'powerOff':      '*power = 0 \r',
		'shutterOpen':   '*shutter = 1 \r',
		'shutterClose':  '*shutter = 0 \r',
		'freeze':        '*freeze = 1 \r',
		'unfreeze':      '*freeze = 0 \r',
		'bright+':       '*brightnes + \r',
		'bright-':       '*brightnes - \r',
		'cont+':         '*contrast + \r',
		'cont-':         '*contrast - \r',
		'sat+':          '*saturation + \r',
		'sat-':          '*saturation - \r'
	};

	if (dphl[id] !== undefined) {

		if (self.udp !== undefined) {

			debug('sending',dphl[id],"to",self.udp.host);
			self.udp.send(dphl[id]);

		}
	}
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;
