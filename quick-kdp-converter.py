#!/usr/bin/env python3
"""
簡易KDP変換システム
依存関係最小版 - 標準ライブラリのみ使用
"""

import os
import json
import re
import zipfile
import tempfile
from datetime import datetime
from pathlib import Path
import xml.etree.ElementTree as ET

class QuickKDPConverter:
    """簡易KDP変換システム（依存関係最小版）"""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def extract_book_metadata(self, book_path):
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
        
        # タイトル抽出
        title_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        if title_match:
            metadata['title'] = title_match.group(1)
            
        return metadata
    
    def markdown_to_html(self, markdown_text):
        """簡易Markdown to HTML変換"""
        html = markdown_text
        
        # ヘッダー変換
        html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
        html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
        html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
        
        # 太字・斜体
        html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
        html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
        
        # リスト
        html = re.sub(r'^- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
        html = re.sub(r'^(\d+)\. (.+)$', r'<li>\2</li>', html, flags=re.MULTILINE)
        
        # 段落
        paragraphs = html.split('\n\n')
        formatted_paragraphs = []
        
        for para in paragraphs:
            para = para.strip()
            if para:
                if not any(tag in para for tag in ['<h', '<li>', '<ul>', '<ol>']):
                    if not para.startswith('<'):
                        para = f'<p>{para}</p>'
                formatted_paragraphs.append(para)
        
        html = '\n\n'.join(formatted_paragraphs)
        
        # リストをul/olで囲む
        html = re.sub(r'(<li>.*?</li>)', r'<ul>\1</ul>', html, flags=re.DOTALL)
        
        return html
    
    def create_simple_epub(self, book_path, output_path):
        """簡易EPUB作成"""
        metadata = self.extract_book_metadata(book_path)
        book_title = metadata.get('title', 'AI Generated Book')
        author = metadata.get('author', 'AI Generated Content')
        
        # EPUBディレクトリ構造作成
        epub_dir = os.path.join(self.temp_dir, 'epub')
        os.makedirs(epub_dir, exist_ok=True)
        os.makedirs(os.path.join(epub_dir, 'META-INF'), exist_ok=True)
        os.makedirs(os.path.join(epub_dir, 'OEBPS'), exist_ok=True)
        
        # mimetype
        with open(os.path.join(epub_dir, 'mimetype'), 'w') as f:
            f.write('application/epub+zip')
        
        # META-INF/container.xml
        container_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>'''
        
        with open(os.path.join(epub_dir, 'META-INF', 'container.xml'), 'w', encoding='utf-8') as f:
            f.write(container_xml)
        
        # 章ファイル処理
        chapters = []
        chapter_files = sorted([f for f in os.listdir(book_path) if f.startswith('chapter-')])
        
        for i, chapter_file in enumerate(chapter_files):
            chapter_path = os.path.join(book_path, chapter_file)
            with open(chapter_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Front matter除去
            if content.startswith('---'):
                end_pos = content.find('---', 3)
                if end_pos != -1:
                    content = content[end_pos + 3:].strip()
            
            html_content = self.markdown_to_html(content)
            
            chapter_html = f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>Chapter {i+1}</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
</head>
<body>
    {html_content}
</body>
</html>'''
            
            chapter_filename = f'chapter{i+1:02d}.xhtml'
            with open(os.path.join(epub_dir, 'OEBPS', chapter_filename), 'w', encoding='utf-8') as f:
                f.write(chapter_html)
            
            chapters.append({
                'id': f'chapter{i+1:02d}',
                'filename': chapter_filename,
                'title': f'Chapter {i+1}'
            })
        
        # content.opf
        content_opf = f'''<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="uid" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:identifier id="uid">urn:uuid:{datetime.now().strftime("%Y%m%d%H%M%S")}</dc:identifier>
        <dc:title>{book_title}</dc:title>
        <dc:creator>{author}</dc:creator>
        <dc:language>ja</dc:language>
        <dc:date>{datetime.now().strftime("%Y-%m-%d")}</dc:date>
        <meta name="cover" content="cover"/>
    </metadata>
    <manifest>
        {''.join([f'<item id="{ch["id"]}" href="{ch["filename"]}" media-type="application/xhtml+xml"/>' for ch in chapters])}
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    </manifest>
    <spine toc="ncx">
        {''.join([f'<itemref idref="{ch["id"]}"/>' for ch in chapters])}
    </spine>
</package>'''
        
        with open(os.path.join(epub_dir, 'OEBPS', 'content.opf'), 'w', encoding='utf-8') as f:
            f.write(content_opf)
        
        # toc.ncx
        toc_ncx = f'''<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:{datetime.now().strftime("%Y%m%d%H%M%S")}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>{book_title}</text>
    </docTitle>
    <navMap>
        {''.join([f'<navPoint id="navpoint-{i+1}" playOrder="{i+1}"><navLabel><text>{ch["title"]}</text></navLabel><content src="{ch["filename"]}"/></navPoint>' for i, ch in enumerate(chapters)])}
    </navMap>
</ncx>'''
        
        with open(os.path.join(epub_dir, 'OEBPS', 'toc.ncx'), 'w', encoding='utf-8') as f:
            f.write(toc_ncx)
        
        # EPUBファイル作成
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as epub_zip:
            # mimetypeは最初に無圧縮で追加
            epub_zip.write(os.path.join(epub_dir, 'mimetype'), 'mimetype', compress_type=zipfile.ZIP_STORED)
            
            # その他のファイルを追加
            for root, dirs, files in os.walk(epub_dir):
                for file in files:
                    if file != 'mimetype':
                        file_path = os.path.join(root, file)
                        arc_path = os.path.relpath(file_path, epub_dir)
                        epub_zip.write(file_path, arc_path)
        
        print(f"✅ EPUB作成完了: {output_path}")
        return output_path
    
    def generate_kdp_package(self, book_path, output_dir='kdp-output'):
        """KDPパッケージ生成"""
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        try:
            metadata = self.extract_book_metadata(book_path)
            book_title = metadata.get('title', 'AI Generated Book')
            safe_title = re.sub(r'[^\w\s-]', '', book_title).strip()
            safe_title = re.sub(r'[-\s]+', '-', safe_title)
            
            # EPUB生成
            epub_filename = f"{safe_title}.epub"
            epub_path = os.path.join(output_dir, epub_filename)
            self.create_simple_epub(book_path, epub_path)
            
            # メタデータJSON生成
            kdp_metadata = {
                'title': book_title,
                'author': metadata.get('author', 'AI Generated Content'),
                'description': metadata.get('description', ''),
                'category': metadata.get('category', 'Self-Help'),
                'language': 'Japanese',
                'generated_at': datetime.now().isoformat(),
                'files': {
                    'epub': epub_path
                },
                'statistics': {
                    'total_chapters': len([f for f in os.listdir(book_path) if f.startswith('chapter-')]),
                    'formats': ['epub']
                }
            }
            
            metadata_path = os.path.join(output_dir, f'{safe_title}-metadata.json')
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(kdp_metadata, f, ensure_ascii=False, indent=2)
            
            print(f"✅ KDPパッケージ生成完了: {output_dir}")
            
            return {
                'success': True,
                'output_dir': output_dir,
                'epub_file': epub_path,
                'metadata_file': metadata_path,
                'book_title': book_title
            }
            
        except Exception as e:
            print(f"❌ 変換エラー: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup(self):
        """一時ファイル削除"""
        import shutil
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

def main():
    """メイン実行"""
    import sys
    
    if len(sys.argv) < 2:
        print("使用方法: python quick-kdp-converter.py <book_directory>")
        print("例: python quick-kdp-converter.py docs/generated-books/self-help-2025-06-29")
        return 1
    
    book_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else 'kdp-output'
    
    if not os.path.exists(book_path):
        print(f"❌ エラー: {book_path} が見つかりません")
        return 1
    
    converter = QuickKDPConverter()
    
    try:
        result = converter.generate_kdp_package(book_path, output_dir)
        
        if result['success']:
            print(f"\n🎉 変換完了!")
            print(f"📖 書籍: {result['book_title']}")
            print(f"📁 出力先: {result['output_dir']}")
            print(f"📄 EPUBファイル: {result['epub_file']}")
            print(f"📋 メタデータ: {result['metadata_file']}")
            return 0
        else:
            print(f"❌ 変換失敗: {result['error']}")
            return 1
            
    finally:
        converter.cleanup()

if __name__ == '__main__':
    exit(main())

# Last Updated: 2025-06-29 04:32:00 JST