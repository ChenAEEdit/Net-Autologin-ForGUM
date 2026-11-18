'use strict';
'require view';
'require form';
'require @ASSET_PATH@.layout as layout';

return view.extend({
	load: function() {
		return layout.loadStatus();
	},

	render: function(initialStatus) {
		var map = new form.Map('net-autologin');
		var section = map.section(form.NamedSection, 'main', 'portal');
		var renderSection = section.render.bind(section);
		var detail = E('p', { 'class': 'net-autologin-detail' });
		var option;

		section.tab('general', _('基本设置'));
		section.tab('portal', _('认证门户'));
		section.tab('leds', _('状态灯'));

		option = section.taboption('general', form.Flag, 'enabled', _('启用自动登录'));
		option.rmempty = false;

		// Keep the native UCI field in the form so saves and resets still use LuCI's parsing.
		section.render = function() {
			return renderSection().then(function(content) {
				var control = content.querySelector('[data-name="enabled"]');
				var controls = E('div', { 'class': 'net-autologin-enabled' });
				if (control) {
					var checkbox = control.querySelector('input[type="checkbox"]');
					checkbox.setAttribute('role', 'switch');
					checkbox.setAttribute('aria-label', _('启用自动登录'));
					controls.appendChild(control);
				}

				var summary = E('section', { 'class': 'net-autologin-summary', 'aria-label': _('连接详情') }, [
					E('div', {}, [
						E('h3', {}, _('连接详情')),
						detail
					]),
					controls
				]);
				return E([], [summary, content]);
			});
		};

		option = section.taboption('general', form.Value, 'interface', _('上联接口'),
			_('填写「网络 → 接口」中的逻辑接口名称。'));
		option.datatype = 'uciname';
		option.default = 'wan';
		option.rmempty = false;

		option = section.taboption('general', form.Value, 'username', _('账号'));
		option.rmempty = true;

		option = section.taboption('general', form.Value, 'password', _('密码'));
		option.password = true;
		option.rmempty = true;

		option = section.taboption('general', form.Value, 'check_interval', _('联网检测间隔（秒）'));
		option.datatype = 'and(uinteger,rangelength(1,4),range(5,3600))';
		option.default = '15';
		option.rmempty = false;

		option = section.taboption('general', form.Value, 'retry_interval', _('掉线重试间隔（秒）'));
		option.datatype = 'and(uinteger,rangelength(1,4),range(5,3600))';
		option.default = '10';
		option.rmempty = false;

		option = section.taboption('general', form.ListValue, 'log_level', _('最低记录级别'),
			_('保存并应用后，对新产生的日志生效。'));
		option.value('info', _('信息、警告和错误'));
		option.value('warn', _('警告和错误'));
		option.value('err', _('仅错误'));
		option.default = 'info';
		option.rmempty = false;

		option = section.taboption('portal', form.Value, 'portal_url', _('认证地址'),
			_('填写完整的 HTTP 或 HTTPS 登录地址，省略查询参数。'));
		option.rmempty = false;
		option.validate = function(sectionId, value) {
			return /^https?:\/\/[^\s\/?#@\\]+\/[^\s?#\\]*$/.test(value)
				|| _('请输入带路径的 HTTP 或 HTTPS 地址，省略账号、查询参数和片段。');
		};

		option = section.taboption('portal', form.Value, 'ac_ip', _('AC IPv4 地址'));
		option.datatype = 'ip4addr("nomask")';
		option.rmempty = false;

		option = section.taboption('portal', form.Value, 'ac_name', _('AC 名称'));
		option.rmempty = false;
		option.validate = function(sectionId, value) {
			return /^[a-zA-Z0-9_.-]+$/.test(value) || _('请使用字母、数字、句点、下划线或连字符。');
		};

		option = section.taboption('portal', form.Value, 'vlan', _('VLAN ID'));
		option.datatype = 'and(uinteger,rangelength(1,4),range(0,4094))';
		option.rmempty = false;

		option = section.taboption('leds', form.Flag, 'led_enabled', _('控制状态灯'));
		option.rmempty = false;

		option = section.taboption('leds', form.Value, 'red_led', _('离线灯名称'));
		option.depends('led_enabled', '1');
		option.default = 'red:status';
		option.retain = true;
		option.rmempty = false;

		option = section.taboption('leds', form.Value, 'blue_led', _('在线灯名称'));
		option.depends('led_enabled', '1');
		option.default = 'blue:status';
		option.retain = true;
		option.rmempty = false;

		return map.render().then(function(content) {
			content.classList.add('net-autologin-settings');
			return layout.page('settings', content, initialStatus, detail);
		});
	}
});
