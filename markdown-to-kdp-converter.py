#!/usr/bin/env python3
"""
Markdown to KDP Converter
Living Book Engine v2 → KDP自動変換システム

VitePressで生成されたMarkdownコンテンツを
KDP対応フォーマット（EPUB, PDF, MOBI）に変換

Required packages:
pip install ebooklib markdown beautifulsoup4 Pillow pypdf2 requests
"""

import os
import json
import re
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import zipfile
import tempfile

# Core libraries
import markdown
from bs4 import BeautifulSoup
from ebooklib import epub
from PIL import Image, ImageDraw, ImageFont
import requests

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class KDPConverter:
    """Markdown to KDP format converter"""
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.temp_dir = tempfile.mkdtemp()
        
    def _load_config(self, config_path: str) -> Dict:
        """設定ファイル読み込み"""
        default_config = {
            "output_formats": ["epub", "pdf"],
            "epub_settings": {
                "language": "ja",
                "publisher": "AI Living Books",
                "rights": "© 2025 AI Generated Content"
            },
            "pdf_settings": {
                "page_size": "A5",
                "font_family": "Noto Sans CJK JP",
                "margin": 20
            },
            "cover_settings": {
                "width": 1600,
                "height": 2560,
                "background_color": "#ffffff",
                "text_color": "#333333"
            },
            "kdp_categories": [
                "Self-Help",
                "Business & Money",
                "Health, Fitness & Dieting",
                "Computers & Technology"
            ]
        }
        
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                user_config = json.load(f)
                default_config.update(user_config)
                
        return default_config
    
    def extract_book_metadata(self, book_path: str) -> Dict:
        """書籍メタデータ抽出"""
        index_path = os.path.join(book_path, 'index.md')
        
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"index.md not found in {book_path}")
            
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Front matterからメタデータ抽出
        metadata = {}
        if content.startswith('---'):
            end_pos = content.find('---', 3)
            if end_pos != -1:
                front_matter = content[3:end_pos]
                for line in front_matter.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        metadata[key.strip()] = value.strip().strip('"\'')
        
        # タイトル抽出（# で始まる最初の行）
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if title_match:
            metadata['title'] = title_match.group(1)
            
        # 章構成抽出
        chapters = []
        chapter_pattern = r'\d+\.\s+\[([^\]]+)\]\(([^)]+)\)'
        for match in re.finditer(chapter_pattern, content):
            chapters.append({
                'title': match.group(1),
                'file': match.group(2)
            })
        
        metadata['chapters'] = chapters        
        return metadata
    
    def process_markdown_files(self, book_path: str) -> List[Dict]:
        """Markdownファイル処理"""
        processed_chapters = []
        
        # 章ファイルを順序通りに処理
        chapter_files = sorted(
            [f for f in os.listdir(book_path) if f.endswith('.md') and f != 'index.md']
        )
        
        for chapter_file in chapter_files:
            chapter_path = os.path.join(book_path, chapter_file)
            
            with open(chapter_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Front matter除去
            if content.startswith('---'):
                end_pos = content.find('---', 3)
                if end_pos != -1:
                    content = content[end_pos + 3:].strip()
            
            # Markdown to HTML変換
            html_content = markdown.markdown(
                content, 
                extensions=['toc', 'tables', 'fenced_code']
            )
            
            # 画像パス修正（相対パス → 絶対パス）
            html_content = self._fix_image_paths(html_content, book_path)
            
            processed_chapters.append({
                'filename': chapter_file,
                'html_content': html_content,
                'word_count': len(content.split())
            })
            
        return processed_chapters
    
    def _fix_image_paths(self, html_content: str, book_path: str) -> str:
        """画像パス修正"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src and not src.startswith(('http://', 'https://')):
                # 相対パスを絶対パスに変換
                abs_path = os.path.join(book_path, src)
                if os.path.exists(abs_path):
                    img['src'] = abs_path
                    
        return str(soup)
    
    def generate_cover_image(self, title: str, author: str = "AI Generated") -> str:
        """カバー画像生成"""
        config = self.config['cover_settings']
        
        # 画像作成
        img = Image.new('RGB', (config['width'], config['height']), config['background_color'])
        draw = ImageDraw.Draw(img)
        
        try:
            # フォント設定（システムフォント使用）
            title_font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 80)
            author_font = ImageFont.truetype('/System/Library/Fonts/Arial.ttf', 40)
        except:
            # フォントが見つからない場合はデフォルト使用
            title_font = ImageFont.load_default()
            author_font = ImageFont.load_default()
        
        # テキスト描画
        img_width, img_height = img.size
        
        # タイトル描画
        title_bbox = draw.textbbox((0, 0), title, font=title_font)
        title_width = title_bbox[2] - title_bbox[0]
        title_height = title_bbox[3] - title_bbox[1]
        
        # 長いタイトルの場合は改行
        if title_width > img_width * 0.8:
            words = title.split()
            lines = []
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                test_bbox = draw.textbbox((0, 0), test_line, font=title_font)
                test_width = test_bbox[2] - test_bbox[0]
                
                if test_width <= img_width * 0.8:
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
            
            if current_line:
                lines.append(' '.join(current_line))
                
            # 複数行描画
            line_spacing = 10
            total_height = len(lines) * title_height + (len(lines) - 1) * line_spacing
            start_y = (img_height - total_height) // 3
            
            for i, line in enumerate(lines):
                line_bbox = draw.textbbox((0, 0), line, font=title_font)
                line_width = line_bbox[2] - line_bbox[0]
                x = (img_width - line_width) // 2
                y = start_y + i * (title_height + line_spacing)
                draw.text((x, y), line, fill=config['text_color'], font=title_font)
        else:
            # 単行描画
            x = (img_width - title_width) // 2
            y = img_height // 3
            draw.text((x, y), title, fill=config['text_color'], font=title_font)
        
        # 著者名描画
        author_bbox = draw.textbbox((0, 0), author, font=author_font)
        author_width = author_bbox[2] - author_bbox[0]
        x = (img_width - author_width) // 2
        y = img_height * 2 // 3
        draw.text((x, y), author, fill=config['text_color'], font=author_font)
        
        # カバー画像保存
        cover_path = os.path.join(self.temp_dir, 'cover.png')
        img.save(cover_path, 'PNG', quality=95)
        
        logger.info(f"カバー画像生成完了: {cover_path}")
        return cover_path
    
    def create_epub(self, metadata: Dict, chapters: List[Dict], cover_path: str) -> str:
        """EPUB作成"""
        book = epub.EpubBook()
        
        # メタデータ設定
        book.set_identifier(f"ai-book-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
        book.set_title(metadata.get('title', 'AI Generated Book'))
        book.set_language(self.config['epub_settings']['language'])
        book.add_author(metadata.get('author', 'AI Generated'))
        book.set_cover("cover.png", open(cover_path, 'rb').read())
        
        # 章追加
        epub_chapters = []
        spine = ['nav']
        
        for i, chapter in enumerate(chapters):
            chapter_id = f"chapter_{i+1:02d}"
            
            epub_chapter = epub.EpubHtml(
                title=f"Chapter {i+1}",
                file_name=f"{chapter_id}.xhtml",
                lang=self.config['epub_settings']['language']
            )
            epub_chapter.content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Chapter {i+1}</title>
                <meta charset="utf-8"/>
            </head>
            <body>
                {chapter['html_content']}
            </body>
            </html>
            """
            
            book.add_item(epub_chapter)
            epub_chapters.append(epub_chapter)
            spine.append(epub_chapter)
        
        # 目次作成
        book.toc = [(epub.Section('Chapters'), epub_chapters)]
        
        # Navigation files
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        
        # Spine設定
        book.spine = spine
        
        # EPUB保存
        epub_filename = f"{metadata.get('title', 'book').replace(' ', '_')}.epub"
        epub_path = os.path.join(self.temp_dir, epub_filename)
        
        epub.write_epub(epub_path, book, {})
        logger.info(f"EPUB作成完了: {epub_path}")
        
        return epub_path
    
    def create_pdf_via_pandoc(self, metadata: Dict, book_path: str) -> str:
        """Pandoc経由でPDF作成"""
        import subprocess
        
        # Markdown統合
        combined_md = os.path.join(self.temp_dir, 'combined.md')
        
        with open(combined_md, 'w', encoding='utf-8') as outfile:
            # メタデータ書き込み
            outfile.write(f"---\n")
            outfile.write(f"title: {metadata.get('title', 'AI Generated Book')}\n")
            outfile.write(f"author: {metadata.get('author', 'AI Generated')}\n")
            outfile.write(f"date: {datetime.now().strftime('%Y-%m-%d')}\n")
            outfile.write(f"language: ja\n")
            outfile.write(f"---\n\n")
            
            # 章ファイル統合
            chapter_files = [f for f in os.listdir(book_path) 
                           if f.endswith('.md') and f != 'index.md']
            chapter_files.sort()
            
            for chapter_file in chapter_files:
                chapter_path = os.path.join(book_path, chapter_file)
                with open(chapter_path, 'r', encoding='utf-8') as infile:
                    content = infile.read()
                    
                    # Front matter除去
                    if content.startswith('---'):
                        end_pos = content.find('---', 3)
                        if end_pos != -1:
                            content = content[end_pos + 3:].strip()
                    
                    outfile.write(content + '\n\n\\newpage\n\n')
        
        # PDF生成
        pdf_filename = f"{metadata.get('title', 'book').replace(' ', '_')}.pdf"
        pdf_path = os.path.join(self.temp_dir, pdf_filename)
        
        pandoc_cmd = [
            'pandoc',
            combined_md,
            '--from', 'markdown',
            '--to', 'pdf',
            '--output', pdf_path,
            '--pdf-engine=xelatex',
            '--toc',
            '--variable', 'mainfont=Noto Sans CJK JP',
            '--variable', 'geometry:margin=2cm'
        ]
        
        try:
            subprocess.run(pandoc_cmd, check=True)
            logger.info(f"PDF作成完了: {pdf_path}")
            return pdf_path
        except subprocess.CalledProcessError as e:
            logger.error(f"PDF作成エラー: {e}")
            return None
    
    def generate_kdp_package(self, book_path: str, output_dir: str = None) -> Dict:
        """KDPパッケージ生成"""
        if not output_dir:
            output_dir = os.path.join(os.getcwd(), 'kdp-output')
            
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            # メタデータ抽出
            logger.info("メタデータ抽出中...")
            metadata = self.extract_book_metadata(book_path)
            
            # Markdown処理
            logger.info("Markdownファイル処理中...")
            chapters = self.process_markdown_files(book_path)
            
            # カバー画像生成
            logger.info("カバー画像生成中...")
            cover_path = self.generate_cover_image(
                metadata.get('title', 'AI Generated Book'),
                metadata.get('author', 'AI Generated')
            )
            
            # フォーマット変換
            converted_files = {}
            
            if 'epub' in self.config['output_formats']:
                logger.info("EPUB変換中...")
                epub_path = self.create_epub(metadata, chapters, cover_path)
                if epub_path:
                    final_epub = os.path.join(output_dir, os.path.basename(epub_path))
                    os.rename(epub_path, final_epub)
                    converted_files['epub'] = final_epub
            
            if 'pdf' in self.config['output_formats']:
                logger.info("PDF変換中...")
                pdf_path = self.create_pdf_via_pandoc(metadata, book_path)
                if pdf_path:
                    final_pdf = os.path.join(output_dir, os.path.basename(pdf_path))
                    os.rename(pdf_path, final_pdf)
                    converted_files['pdf'] = final_pdf
            
            # カバー画像コピー
            final_cover = os.path.join(output_dir, 'cover.png')
            os.rename(cover_path, final_cover)
            converted_files['cover'] = final_cover
            
            # KDPメタデータJSON生成
            kdp_metadata = {
                'title': metadata.get('title'),
                'author': metadata.get('author', 'AI Generated'),
                'description': metadata.get('description', ''),
                'keywords': metadata.get('keywords', '').split(',') if metadata.get('keywords') else [],
                'category': metadata.get('category', 'Self-Help'),
                'language': 'Japanese',
                'generated_at': datetime.now().isoformat(),
                'files': converted_files,
                'statistics': {
                    'total_chapters': len(chapters),
                    'total_words': sum(ch['word_count'] for ch in chapters),
                    'formats': list(converted_files.keys())
                }
            }
            
            metadata_path = os.path.join(output_dir, 'kdp-metadata.json')
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(kdp_metadata, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ KDPパッケージ生成完了: {output_dir}")
            
            return {
                'success': True,
                'output_dir': output_dir,
                'files': converted_files,
                'metadata': kdp_metadata
            }
            
        except Exception as e:
            logger.error(f"❌ 変換エラー: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup(self):
        """一時ファイル削除"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
            logger.info("一時ファイル削除完了")

def main():
    """メイン実行関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Markdown to KDP Converter')
    parser.add_argument('book_path', help='書籍ディレクトリパス')
    parser.add_argument('--output', '-o', help='出力ディレクトリ', default='kdp-output')
    parser.add_argument('--config', '-c', help='設定ファイルパス')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.book_path):
        print(f"❌ エラー: {args.book_path} が見つかりません")
        return 1
    
    converter = KDPConverter(args.config)
    
    try:
        result = converter.generate_kdp_package(args.book_path, args.output)
        
        if result['success']:
            print(f"🎉 変換完了!")
            print(f"📁 出力先: {result['output_dir']}")
            print(f"📊 統計: {result['metadata']['statistics']}")
            
            for format_type, file_path in result['files'].items():
                print(f"  - {format_type.upper()}: {file_path}")
                
            return 0
        else:
            print(f"❌ 変換失敗: {result['error']}")
            return 1
            
    finally:
        converter.cleanup()

if __name__ == '__main__':
    exit(main())

# Last Updated: 2025-06-29 04:24:00 JST