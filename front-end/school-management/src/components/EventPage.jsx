import React, { useState, useEffect } from 'react';
import axios from '../redux/axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const EventPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Для пагинации
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Для фильтрации по названию события
    const [searchTitle, setSearchTitle] = useState('');

    const fetchEvents = () => {
        setLoading(true);
        setError(null);
        axios.get('/events', {
            params: {
                page,
                limit: 10,
                title: searchTitle
            }
        })
            .then(response => {
                const data = response.data;
                setEvents(data.data);
                setTotalPages(data.totalPages);
                setLoading(false);
            })
            .catch(err => {
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchEvents();
    }, [page, searchTitle]);

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        if (page < totalPages) setPage(page + 1);
    };

    return (
        <div className="container mt-5">
            <h2 className="mb-4">События</h2>

            {/* Фильтр по названию */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Поиск по названию события"
                    value={searchTitle}
                    onChange={e => {
                        setSearchTitle(e.target.value);
                        setPage(1);
                    }}
                />
            </div>

            {loading ? (
                <p>Загрузка событий...</p>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : events && events.length > 0 ? (
                <>
                    <div className="row">
                        {events.map(event => (
                            <div key={event.id} className="col-md-6 col-lg-4 mb-4">
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title">{event.title}</h5>
                                        <h6 className="card-subtitle mb-2 text-muted">
                                            {new Date(event.event_date).toLocaleDateString()}
                                        </h6>
                                        <p className="card-text">
                                            {event.description || 'Нет описания'}
                                        </p>
                                        <p className="mb-1">
                                            <strong>Организатор:</strong> {event.organizer_type === 'teacher' ? 'Учитель' : event.organizer_type}
                                        </p>
                                        <div className="mt-auto">
                                            <div>
                                                <strong>Ученики:</strong>
                                                {event.Students && event.Students.length > 0 ? (
                                                    <ul className="list-unstyled mb-0">
                                                        {event.Students.map(student => (
                                                            <li key={student.id}>
                                                                {student.first_name} {student.last_name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="mb-0">Отсутствуют</p>
                                                )}
                                            </div>
                                            <div className="mt-2">
                                                <strong>Учителя:</strong>
                                                {event.Teachers && event.Teachers.length > 0 ? (
                                                    <ul className="list-unstyled mb-0">
                                                        {event.Teachers.map(teacher => (
                                                            <li key={teacher.id}>
                                                                {teacher.first_name} {teacher.last_name} ({teacher.subject})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="mb-0">Отсутствуют</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Пагинация */}
                    <div className="d-flex justify-content-between align-items-center">
                        <button className="btn btn-secondary" onClick={handlePrevPage} disabled={page === 1}>
                            Предыдущая
                        </button>
                        <span>Страница {page} из {totalPages}</span>
                        <button className="btn btn-secondary" onClick={handleNextPage} disabled={page === totalPages}>
                            Следующая
                        </button>
                    </div>
                </>
            ) : (
                <p>События отсутствуют</p>
            )}
        </div>
    );
};

export default EventPage;
