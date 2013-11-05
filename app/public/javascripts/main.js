require.config({
    'baseUrl': '/javascripts',
    'paths':
    {
        //helpers
        async: 'helpers/async',
        underscore : 'helpers/underscore',
        //jquery modules
        notify : 'modules/desktop-notify',
        ejs : 'modules/jquery.ejs',
        cookie : 'modules/jquery.cookie',
        quickfit : 'modules/quickfit',
        //admin modules
        collapse : 'modules/jquery.collapse',
        collapse_storage : 'modules/jquery.collapse_storage',
        customselect: 'modules/customselect',
        //Packery deps
        classie: 'packery/classie',
        eventie: 'packery/eventie',
        'doc-ready': 'packery/doc-ready',
        eventEmitter: 'packery/eventEmitter',
        'get-style-property': 'packery/get-style-property',
        'get-size': 'packery/get-size',
        'matches-selector': 'packery/matches-selector',
        outlayer: 'packery/outlayer',
        imagesloaded : 'packery/imagesloaded/imagesloaded',
        packery : 'packery/packery/js',
        desktop : 'desktop',
        theme : '../js/theme',
        sockets : '../socket.io/socket.io'
    },

    //Load non-modular/legacy code
    //SEE https://github.com/jrburke/requirejs/wiki/Upgrading-to-RequireJS-2.0#wiki-shim
    shim: {
        'notify': ['jquery'],
        'ejs': ['jquery'],
        'cookie' : ['jquery'],
        'quickfit' : ['jquery'],
        'collapse' : ['jquery'],
        'collapse_storage' : ['collapse', 'jquery'],
        'customselect' : ['jquery'],
        'desktop' : ['sockets'],
        'theme' : {
            deps : ['desktop']
        }
    },

    //SEE http://requirejs.org/docs/api.html#config-waitSeconds
    waitSeconds: 25
});


require(['desktop', 'sockets', 'theme'], function(Desktop) {

    var socket = Desktop.socket;

    socket.on('files', function(d) {

        d = JSON.parse(d);
        console.log('Receiving files', d.paths);

        if(config.location == '/')
            Desktop.append(d.paths);

        //Desktop.showNotification({title: 'Fichier ajouté',text: d.count + ' fichier(s) ajouté(s)'});

    });
    

    socket.on('remove', function(id) {
        //TODO
        // if($('.element.list[data-id='+id+']').length) {
        //     var titre = $('.element.list[data-id='+id+']').find('h1').text();
        //     showNotification({title: 'Fichier supprimé',tag:id,text: titre + ' a été supprimé'});
        // }

        // $section.isotope( 'remove', $('[data-id='+id+']'), function() {

        // });
    });


    //SOME TEST DATAS
    // var datas = JSON.parse(' [{"__v":0,"_id":"5257bdb48019e16201000005","albums":[{"artist":"Current Value","album":"Rare & The Unreleased 1997 - 2000","year":"2012","genre":"Drum n Bass","picture":"images/cover/audio.png","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","_id":"525bcbbc2731536906000004","__v":0,"dateAdded":"2013-10-14T10:47:24.124Z","songs":[{"name":"01. Current Value - Bass Mob.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/01. Current Value - Bass Mob.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":17918201,"_id":"525bcbbc2731536906000013","episode":null},{"name":"02. Current Value - Bass Riot.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/02. Current Value - Bass Riot.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":16506546,"_id":"525bcbbc2731536906000012","episode":null},{"name":"03. Current Value - Endless Rounds.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/03. Current Value - Endless Rounds.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":19592140,"_id":"525bcbbc2731536906000011","episode":null},{"name":"04. Current Value - I.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/04. Current Value - I.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":18218073,"_id":"525bcbbc2731536906000010","episode":null},{"name":"05. Current Value - II.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/05. Current Value - II.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":19529422,"_id":"525bcbbc273153690600000f","episode":null},{"name":"06. Current Value - III.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/06. Current Value - III.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":17835644,"_id":"525bcbbc273153690600000e","episode":null},{"name":"07. Current Value - Intermitter.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/07. Current Value - Intermitter.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":19092673,"_id":"525bcbbc273153690600000d","episode":null},{"name":"08. Current Value - Monolith.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/08. Current Value - Monolith.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":17884765,"_id":"525bcbbc273153690600000c","episode":null},{"name":"09. Current Value - Sub Low Reference.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/09. Current Value - Sub Low Reference.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":18021664,"_id":"525bcbbc273153690600000b","episode":null},{"name":"10. Current Value - Tekkno Session.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/10. Current Value - Tekkno Session.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":19364353,"_id":"525bcbbc273153690600000a","episode":null},{"name":"11. Current Value - Termination.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/11. Current Value - Termination.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":17010192,"_id":"525bcbbc2731536906000009","episode":null},{"name":"12. Current Value - Untitled 1.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/12. Current Value - Untitled 1.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":16877488,"_id":"525bcbbc2731536906000008","episode":null},{"name":"13. Current Value - Untitled 2.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/13. Current Value - Untitled 2.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":16334141,"_id":"525bcbbc2731536906000007","episode":null},{"name":"14. Current Value - Untitled Master.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/14. Current Value - Untitled Master.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":18846086,"_id":"525bcbbc2731536906000006","episode":null},{"name":"15. Current Value - VI.mp3","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR/15. Current Value - VI.mp3","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/[PC085] Current Value - Rare & The Unreleased 1997 - 2000 WEB-320-CBR","type":"audio","size":16977782,"_id":"525bcbbc2731536906000005","episode":null}]}],"dateUpdated":"2013-10-14T12:33:48.846Z","movies":[{"movieType":"movie","name":"Sound Of Noise","title":"Sound Of Noise","synopsis":"L’officier de police Amadeus Warnebring est né dans une illustre famille de musiciens. Ironie du sort, il déteste la musique.<br/>Sa vie bascule le jour où un groupe de musiciens déjantés décide d’exécuter une œuvre musicale apocalyptique en utilisant la ville comme instrument de musique…<br/>Il s’engage alors dans sa  première enquête policière musicale...","trailer":"http://www.allocine.fr/blogvision/19113214","picture":"http://images.allocine.fr/medias/nmedia/18/69/23/18/19589366.jpg","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","_id":"525be4ac2520d8cc06000004","__v":0,"dateAdded":"2013-10-14T12:33:48.836Z","videos":[{"name":"Sound Of Noise","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Sound.Of.Noise.2010.VOSTFR.DVDRiP.XViD-STVFRVTW777.avi","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","type":"video","size":736797838,"_id":"525be4ac2520d8cc06000005","episode":null}]},{"movieType":"tvseries","name":"Person Of Interest","season":"03","title":"Person of Interest","synopsis":"Un agent paramilitaire de la CIA, présumé mort, est recruté par un millionnaire reclu pour travailler sur un projet top-secret : prévenir le crime avant qu\'il ne se produise ! Un ingénieux programme élaboré par Finch identifie chaque jour des personnes qui vont être impliquées dans un crime. Victime ou coupable ? Reese va devoir mener l\'enquête pour découvrir qui est en danger et empêcher qu\'un nouveau meurtre soit commis...","trailer":"http://www.allocine.fr/blogvision/19325944","picture":"http://images.allocine.fr/medias/nmedia/18/84/44/70/19775786.jpg","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E01.PROPER.VOSTFR.720p.HDTV.x264-ATeam","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E01.PROPER.VOSTFR.720p.HDTV.x264-ATeam","_id":"525be4ac2520d8cc06000006","__v":0,"dateAdded":"2013-10-14T12:33:48.838Z","videos":[{"name":"Person Of Interest","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E01.PROPER.VOSTFR.720p.HDTV.x264-ATeam/Person.Of.Interest.S03E01.PROPER.VOSTFR.720p.HDTV.x264-ATeam.mkv","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E01.PROPER.VOSTFR.720p.HDTV.x264-ATeam","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E01.PROPER.VOSTFR.720p.HDTV.x264-ATeam","type":"video","size":993730388,"_id":"525be4ac2520d8cc06000009","episode":"01"},{"name":"Person Of Interest","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E02.PROPER.VOSTFR.720p.HDTV.x264-ATeam/Person.Of.Interest.S03E02.PROPER.VOSTFR.720p.HDTV.x264-ATeam.mkv","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E02.PROPER.VOSTFR.720p.HDTV.x264-ATeam","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.Of.Interest.S03E02.PROPER.VOSTFR.720p.HDTV.x264-ATeam","type":"video","size":1043404384,"_id":"525be4ac2520d8cc06000008","episode":"02"},{"name":"Person of Interest","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.of.Interest.S03E03.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON/Person.of.Interest.S03E03.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON.mkv","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.of.Interest.S03E03.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/Person.of.Interest.S03E03.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON","type":"video","size":991023158,"_id":"525be4ac2520d8cc06000007","episode":"03"}]},{"movieType":"tvseries","name":"The Simpsons","season":"25","title":"Les Simpson","synopsis":"Les Simpson, famille américaine moyenne, vivent à Springfield. Homer, le père, a deux passions : regarder la télé et boire des bières. Mais son quotidien est rarement reposant, entre son fils Bart qui fait toutes les bêtises possibles, sa fille Lisa qui est une surdouée, ou encore sa femme Marge qui ne supporte pas de le voir se soûler à longueur de journée.","trailer":"http://www.allocine.fr/blogvision/19383605","picture":"http://images.allocine.fr/medias/nmedia/18/79/96/51/19694367.jpg","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/The.Simpsons.S25E01.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/The.Simpsons.S25E01.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON","_id":"525be4ac2520d8cc0600000a","__v":0,"dateAdded":"2013-10-14T12:33:48.838Z","videos":[{"name":"The Simpsons","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/The.Simpsons.S25E01.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON/The.Simpsons.S25E01.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON.mkv","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/The.Simpsons.S25E01.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/The.Simpsons.S25E01.FASTSUB.VOSTFR.720p.HDTV.x264-ADDiCTiON","type":"video","size":390259712,"_id":"525be4ac2520d8cc0600000b","episode":"01"}]}],"others":[{"name":"InstallESD.dmg","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","_id":"525bcd5df963937d06000004","__v":0,"files":[{"name":"InstallESD.dmg","path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka/InstallESD.dmg","prevDir":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","prevDirRelative":"/Users/soyuka/Sites/ezseed2/downloads/soyuka","type":"application","size":4450989350,"_id":"525bcd5df963937d06000005","episode":null}],"dateAdded":"2013-10-14T10:54:21.925Z"}],"path":"/Users/soyuka/Sites/ezseed2/downloads/soyuka"}]')

});








        