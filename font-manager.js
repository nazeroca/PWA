// フォント読み込み管理
class FontManager {
    constructor() {
        this.loadedFonts = new Set();
        this.requiredFonts = [
            'Noto Sans JP',
            'JetBrains Mono',
            'Orbitron'
        ];
        this.init();
    }

    async init() {
        // ドキュメントにフォント読み込み中のクラスを追加
        document.documentElement.classList.add('font-loading');

        try {
            await this.loadFonts();
            this.onFontsLoaded();
        } catch (error) {
            console.warn('一部のフォントの読み込みに失敗しました:', error);
            this.onFontsLoaded(); // フォールバックフォントで続行
        }
    }

    async loadFonts() {
        const fontPromises = this.requiredFonts.map(fontFamily => 
            this.loadFont(fontFamily)
        );
        
        await Promise.allSettled(fontPromises);
    }

    async loadFont(fontFamily) {
        if (!('fonts' in document)) {
            throw new Error('Font Loading API not supported');
        }

        try {
            await document.fonts.load(`16px "${fontFamily}"`);
            await document.fonts.load(`bold 16px "${fontFamily}"`);
            this.loadedFonts.add(fontFamily);
            console.log(`フォント読み込み完了: ${fontFamily}`);
        } catch (error) {
            console.warn(`フォント読み込み失敗: ${fontFamily}`, error);
        }
    }

    onFontsLoaded() {
        document.documentElement.classList.remove('font-loading');
        document.documentElement.classList.add('font-loaded');
        
        // カスタムイベントを発火
        const event = new CustomEvent('fontsloaded', {
            detail: {
                loadedFonts: Array.from(this.loadedFonts),
                totalFonts: this.requiredFonts.length
            }
        });
        document.dispatchEvent(event);
        
        console.log(`フォント読み込み完了: ${this.loadedFonts.size}/${this.requiredFonts.length}`);
    }

    // フォントが利用可能かチェック
    isFontAvailable(fontFamily) {
        return this.loadedFonts.has(fontFamily);
    }
}

// フォントマネージャーの初期化
const fontManager = new FontManager();

// フォント読み込み完了のイベントリスナー
document.addEventListener('fontsloaded', (event) => {
    console.log('全フォント読み込み処理完了:', event.detail);
});

// エクスポート（必要に応じて）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FontManager;
}
