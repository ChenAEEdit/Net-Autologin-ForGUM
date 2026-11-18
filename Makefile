include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-net-autologin
PKG_VERSION:=1.4.0
PKG_RELEASE:=1
NET_AUTOLOGIN_VERSION:=$(PKG_VERSION)-r$(PKG_RELEASE)
NET_AUTOLOGIN_ASSETS:=net-autologin-$(subst .,_,$(NET_AUTOLOGIN_VERSION))

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-net-autologin
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=LuCI portal auto-login
  PKGARCH:=all
  DEPENDS:=+luci-base +curl +ca-bundle
endef

define Package/luci-app-net-autologin/description
  Monitor IPv4 connectivity and sign in to a configured webauth portal.
  Includes a procd service and LuCI pages for configuration and logs.
endef

define Package/luci-app-net-autologin/conffiles
/etc/config/net-autologin
endef

define Build/Compile
endef

define Package/luci-app-net-autologin/install
	$(INSTALL_DIR) $(1)/etc/config $(1)/etc/init.d $(1)/etc/uci-defaults $(1)/usr/sbin $(1)/usr/libexec
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/$(NET_AUTOLOGIN_ASSETS)
	$(INSTALL_DIR) $(1)/www/luci-static/resources/$(NET_AUTOLOGIN_ASSETS)
	$(INSTALL_CONF) ./files/etc/config/net-autologin $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/net-autologin $(1)/etc/init.d/
	$(INSTALL_BIN) ./files/etc/uci-defaults/90-net-autologin $(1)/etc/uci-defaults/90-net-autologin-assets
	$(INSTALL_BIN) ./files/usr/sbin/net-autologin $(1)/usr/sbin/
	$(INSTALL_BIN) ./files/usr/libexec/net-autologin-log $(1)/usr/libexec/
	$(INSTALL_DATA) ./files/usr/share/luci/menu.d/luci-app-net-autologin.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/luci-app-net-autologin.json $(1)/usr/share/rpcd/acl.d/
	$(INSTALL_DATA) ./files/www/luci-static/resources/view/net-autologin.js $(1)/www/luci-static/resources/view/$(NET_AUTOLOGIN_ASSETS)/settings.js
	$(INSTALL_DATA) ./files/www/luci-static/resources/view/net-autologin-log.js $(1)/www/luci-static/resources/view/$(NET_AUTOLOGIN_ASSETS)/logs.js
	$(INSTALL_DATA) ./files/www/luci-static/resources/net-autologin-ui.js $(1)/www/luci-static/resources/$(NET_AUTOLOGIN_ASSETS)/layout.js
	$(INSTALL_DATA) ./files/www/luci-static/resources/net-autologin.css $(1)/www/luci-static/resources/$(NET_AUTOLOGIN_ASSETS)/style.css
	$(SED) 's|@ASSET_PATH@|$(NET_AUTOLOGIN_ASSETS)|g; s|@PACKAGE_VERSION@|$(NET_AUTOLOGIN_VERSION)|g' \
		$(1)/usr/share/luci/menu.d/luci-app-net-autologin.json \
		$(1)/www/luci-static/resources/view/$(NET_AUTOLOGIN_ASSETS)/*.js \
		$(1)/www/luci-static/resources/$(NET_AUTOLOGIN_ASSETS)/layout.js
endef

$(eval $(call BuildPackage,luci-app-net-autologin))
