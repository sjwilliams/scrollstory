rm -rf js
rm -rf css
rm -rf *.html
mkdir -p tmp
git clone --depth 1 https://github.com/sjwilliams/scrollstory.git tmp
cd tmp
npm install
npm run build
mv build/* ../
cd ..
rm -rf tmp