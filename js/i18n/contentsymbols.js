goog.provide('tl.i18n.ContentSymbols');

/**
 * Media symbols for EN locale.
 */
tl.i18n.ContentSymbols_en_US = {
	APP_TITLE: 'TV Schedule Editor',
	LIBRARY: 'Video library',
	CONTENT: 'Content',
	ADS: 'Advertisement',
	LOADING_LIBRARY: 'Loading list'
};
/**
 * Media symbols for BG locale.
 */
tl.i18n.ContentSymbols_bg = {
	APP_TITLE: 'Редактор на ТВ програмата',
	LIBRARY: 'Видео колекции',
	CONTENT: 'Филми',
	ADS: 'Реклама',
	LOADING_LIBRARY: 'Зареждане на списъка'
};

if (goog.LOCALE == 'en') {
	tl.i18n.ContentSymbols = tl.i18n.ContentSymbols_en_US;
} else if (goog.LOCALE == 'bg') {
	tl.i18n.ContentSymbols = tl.i18n.ContentSymbols_bg;
} else {
	tl.i18n.ContentSymbols = tl.i18n.ContentSymbols_en_US;
};


